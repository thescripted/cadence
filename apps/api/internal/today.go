package app

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrInvalidLogInput = errors.New("invalid today log input")

type CadenceSnapshot struct {
	CadenceID    int64   `json:"habitId"`
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Unit         *string `json:"unit"`
	TargetType   string  `json:"targetType"`
	TargetValue  *int    `json:"targetValue"`
	DisplayOrder int     `json:"displayOrder"`
	CurrentValue int     `json:"currentValue"`
	LogStatus    string  `json:"logStatus"`
	State        string  `json:"state"`
}

type Response struct {
	Date     string            `json:"date"`
	Note     string            `json:"note"`
	Cadences []CadenceSnapshot `json:"habits"`
}

type TodayRepository struct {
	db *pgxpool.Pool
}

type Today struct {
	repo   TodayRepository
	userID int64
}

type UpdateLogInput struct {
	CadenceID int64  `json:"habitId"`
	Status    string `json:"status"`
	Value     *int   `json:"value"`
}

type UpdateNoteInput struct {
	Note string `json:"note"`
}

func NewTodayRepository(db *pgxpool.Pool) TodayRepository {
	return TodayRepository{db: db}
}

func NewToday(repo TodayRepository, userID int64) Today {
	return Today{repo: repo, userID: userID}
}

func (t Today) routes() []routeDef {
	return []routeDef{
		{method: http.MethodGet, path: "", handler: t.get},
		{method: http.MethodPut, path: "/log", handler: t.updateLog},
		{method: http.MethodPut, path: "/note", handler: t.updateNote},
	}
}

func (t Today) get(w http.ResponseWriter, r *http.Request) {
	response, err := t.repo.Get(r.Context(), t.userID, time.Now())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (t Today) updateLog(w http.ResponseWriter, r *http.Request) {
	var input UpdateLogInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	response, err := t.repo.UpdateLog(r.Context(), t.userID, time.Now(), input)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if errors.Is(err, ErrInvalidLogInput) {
			statusCode = http.StatusBadRequest
		}

		writeJSON(w, statusCode, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (t Today) updateNote(w http.ResponseWriter, r *http.Request) {
	var input UpdateNoteInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	response, err := t.repo.UpdateNote(r.Context(), t.userID, time.Now(), input)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (r TodayRepository) Get(ctx context.Context, userID int64, date time.Time) (Response, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			h.id,
			h.name,
			h.type,
			h.unit,
			h.target_type,
			h.target_value,
			h.display_order,
			COALESCE(hl.value, 0) AS current_value,
			hl.status
		FROM habits h
		LEFT JOIN habit_logs hl
			ON hl.habit_id = h.id
			AND hl.user_id = h.user_id
			AND hl.entry_date = $2::date
		WHERE h.user_id = $1
			AND h.is_active = TRUE
			AND h.archived_at IS NULL
		ORDER BY h.display_order ASC, h.id ASC
	`, userID, date.Format("2006-01-02"))
	if err != nil {
		return Response{}, fmt.Errorf("query today habits: %w", err)
	}
	defer rows.Close()

	response := Response{
		Date:     date.Format("2006-01-02"),
		Note:     "",
		Cadences: make([]CadenceSnapshot, 0),
	}

	if note, err := r.getDayNote(ctx, userID, date); err == nil {
		response.Note = note
	} else {
		return Response{}, err
	}

	for rows.Next() {
		var snapshot CadenceSnapshot
		var unit *string
		var targetValue *int
		var logStatus *string

		if err := rows.Scan(
			&snapshot.CadenceID,
			&snapshot.Name,
			&snapshot.Type,
			&unit,
			&snapshot.TargetType,
			&targetValue,
			&snapshot.DisplayOrder,
			&snapshot.CurrentValue,
			&logStatus,
		); err != nil {
			return Response{}, fmt.Errorf("scan today row: %w", err)
		}

		snapshot.Unit = unit
		snapshot.TargetValue = targetValue
		snapshot.LogStatus = deriveLogStatus(logStatus)
		snapshot.State = deriveState(snapshot)
		response.Cadences = append(response.Cadences, snapshot)
	}

	if err := rows.Err(); err != nil {
		return Response{}, fmt.Errorf("iterate today rows: %w", err)
	}

	return response, nil
}

func (r TodayRepository) UpdateNote(ctx context.Context, userID int64, date time.Time, input UpdateNoteInput) (Response, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Response{}, fmt.Errorf("begin update note tx: %w", err)
	}
	defer tx.Rollback(ctx)

	dayEntryID, err := r.ensureDayEntry(ctx, tx, userID, date)
	if err != nil {
		return Response{}, err
	}

	_, err = tx.Exec(ctx, `
		UPDATE day_entries
		SET note = $2, updated_at = NOW()
		WHERE id = $1
	`, dayEntryID, input.Note)
	if err != nil {
		return Response{}, fmt.Errorf("update day note: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Response{}, fmt.Errorf("commit update note tx: %w", err)
	}

	return r.Get(ctx, userID, date)
}

func (r TodayRepository) UpdateLog(ctx context.Context, userID int64, date time.Time, input UpdateLogInput) (Response, error) {
	if err := validateUpdateLogInput(input); err != nil {
		return Response{}, err
	}

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Response{}, fmt.Errorf("begin update log tx: %w", err)
	}
	defer tx.Rollback(ctx)

	cadenceType, err := r.lookupCadenceType(ctx, tx, userID, input.CadenceID)
	if err != nil {
		return Response{}, err
	}

	value := deriveLoggedValue(cadenceType, input)

	dayEntryID, err := r.ensureDayEntry(ctx, tx, userID, date)
	if err != nil {
		return Response{}, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO habit_logs (user_id, habit_id, day_entry_id, entry_date, value, status)
		VALUES ($1, $2, $3, $4::date, $5, $6)
		ON CONFLICT (habit_id, entry_date)
		DO UPDATE SET
			day_entry_id = EXCLUDED.day_entry_id,
			value = EXCLUDED.value,
			status = EXCLUDED.status,
			updated_at = NOW()
	`, userID, input.CadenceID, dayEntryID, date.Format("2006-01-02"), value, input.Status)
	if err != nil {
		return Response{}, fmt.Errorf("upsert habit log: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Response{}, fmt.Errorf("commit update log tx: %w", err)
	}

	return r.Get(ctx, userID, date)
}

func (r TodayRepository) lookupCadenceType(ctx context.Context, tx pgx.Tx, userID, habitID int64) (string, error) {
	var cadenceType string
	err := tx.QueryRow(ctx, `
		SELECT type
		FROM habits
		WHERE id = $1 AND user_id = $2 AND is_active = TRUE AND archived_at IS NULL
	`, habitID, userID).Scan(&cadenceType)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", fmt.Errorf("%w: cadence not found", ErrInvalidLogInput)
		}

		return "", fmt.Errorf("lookup cadence: %w", err)
	}

	return cadenceType, nil
}

func (r TodayRepository) ensureDayEntry(ctx context.Context, tx pgx.Tx, userID int64, date time.Time) (int64, error) {
	var dayEntryID int64
	err := tx.QueryRow(ctx, `
		INSERT INTO day_entries (user_id, entry_date)
		VALUES ($1, $2::date)
		ON CONFLICT (user_id, entry_date)
		DO UPDATE SET updated_at = NOW()
		RETURNING id
	`, userID, date.Format("2006-01-02")).Scan(&dayEntryID)
	if err != nil {
		return 0, fmt.Errorf("ensure day entry: %w", err)
	}

	return dayEntryID, nil
}

func (r TodayRepository) getDayNote(ctx context.Context, userID int64, date time.Time) (string, error) {
	var note *string
	err := r.db.QueryRow(ctx, `
		SELECT note
		FROM day_entries
		WHERE user_id = $1 AND entry_date = $2::date
	`, userID, date.Format("2006-01-02")).Scan(&note)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", fmt.Errorf("get day note: %w", err)
	}
	if note == nil {
		return "", nil
	}
	return *note, nil
}

func validateUpdateLogInput(input UpdateLogInput) error {
	if input.CadenceID <= 0 {
		return fmt.Errorf("%w: habitId is required", ErrInvalidLogInput)
	}

	switch input.Status {
	case "logged", "skipped":
	default:
		return fmt.Errorf("%w: status must be logged or skipped", ErrInvalidLogInput)
	}

	if input.Value != nil && *input.Value < 0 {
		return fmt.Errorf("%w: value must be non-negative", ErrInvalidLogInput)
	}

	return nil
}

func deriveLoggedValue(cadenceType string, input UpdateLogInput) int {
	if input.Status == "skipped" {
		return 0
	}

	if input.Value == nil {
		if cadenceType == "binary" {
			return 1
		}
		return 0
	}

	return *input.Value
}

func deriveLogStatus(logStatus *string) string {
	if logStatus == nil {
		return "not_logged"
	}

	return *logStatus
}

func deriveState(snapshot CadenceSnapshot) string {
	if snapshot.LogStatus == "skipped" {
		return "skipped"
	}

	if snapshot.LogStatus == "not_logged" {
		return "missed"
	}

	switch snapshot.TargetType {
	case "complete":
		if snapshot.CurrentValue >= 1 {
			return "successful"
		}
	case "at_least":
		if snapshot.TargetValue != nil && snapshot.CurrentValue >= *snapshot.TargetValue {
			return "successful"
		}
	case "at_most":
		if snapshot.TargetValue != nil && snapshot.CurrentValue <= *snapshot.TargetValue {
			return "successful"
		}
	case "exact":
		if snapshot.TargetValue != nil && snapshot.CurrentValue == *snapshot.TargetValue {
			return "successful"
		}
	}

	return "incomplete"
}
