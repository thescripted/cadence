package app

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CadenceSummary struct {
	CadenceID      int64  `json:"habitId"`
	Name           string `json:"name"`
	Type           string `json:"type"`
	SuccessfulDays int    `json:"successfulDays"`
	IncompleteDays int    `json:"incompleteDays"`
	SkippedDays    int    `json:"skippedDays"`
	MissedDays     int    `json:"missedDays"`
	TotalValue     int    `json:"totalValue"`
	TargetValue    *int   `json:"targetValue"`
	TargetType     string `json:"targetType"`
}

type WeekResponse struct {
	StartDate string           `json:"startDate"`
	EndDate   string           `json:"endDate"`
	Cadences  []CadenceSummary `json:"habits"`
}

type RecapRepository struct {
	db *pgxpool.Pool
}

type Recap struct {
	repo   RecapRepository
	userID int64
}

func NewRecapRepository(db *pgxpool.Pool) RecapRepository {
	return RecapRepository{db: db}
}

func NewRecap(repo RecapRepository, userID int64) Recap {
	return Recap{repo: repo, userID: userID}
}

func (r Recap) routes() []routeDef {
	return []routeDef{
		{method: http.MethodGet, path: "/week", handler: r.week},
	}
}

func (r Recap) week(w http.ResponseWriter, req *http.Request) {
	response, err := r.repo.Week(req.Context(), r.userID, time.Now())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (r RecapRepository) Week(ctx context.Context, userID int64, endDate time.Time) (WeekResponse, error) {
	startDate := endDate.AddDate(0, 0, -6)
	rows, err := r.db.Query(ctx, `
		SELECT
			h.id,
			h.name,
			h.type,
			h.target_type,
			h.target_value,
			COALESCE(SUM(hl.value), 0) AS total_value,
			COALESCE(SUM(CASE
				WHEN hl.status = 'skipped' THEN 1
				ELSE 0
			END), 0) AS skipped_days,
			COALESCE(SUM(CASE
				WHEN hl.status = 'logged' AND (
					(h.target_type = 'complete' AND hl.value >= 1) OR
					(h.target_type = 'at_least' AND hl.value >= h.target_value) OR
					(h.target_type = 'at_most' AND hl.value <= h.target_value) OR
					(h.target_type = 'exact' AND hl.value = h.target_value)
				) THEN 1
				ELSE 0
			END), 0) AS successful_days,
			COALESCE(SUM(CASE
				WHEN hl.status = 'logged' AND NOT (
					(h.target_type = 'complete' AND hl.value >= 1) OR
					(h.target_type = 'at_least' AND hl.value >= h.target_value) OR
					(h.target_type = 'at_most' AND hl.value <= h.target_value) OR
					(h.target_type = 'exact' AND hl.value = h.target_value)
				) THEN 1
				ELSE 0
			END), 0) AS incomplete_days,
			7 - COUNT(hl.id) AS missed_days
		FROM habits h
		LEFT JOIN habit_logs hl
			ON hl.habit_id = h.id
			AND hl.user_id = h.user_id
			AND hl.entry_date BETWEEN $2::date AND $3::date
		WHERE h.user_id = $1
			AND h.is_active = TRUE
			AND h.archived_at IS NULL
		GROUP BY h.id, h.name, h.type, h.target_type, h.target_value, h.display_order
		ORDER BY h.display_order ASC, h.id ASC
	`, userID, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
	if err != nil {
		return WeekResponse{}, fmt.Errorf("query week recap: %w", err)
	}
	defer rows.Close()

	response := WeekResponse{
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.Format("2006-01-02"),
		Cadences:  make([]CadenceSummary, 0),
	}

	for rows.Next() {
		var item CadenceSummary
		if err := rows.Scan(
			&item.CadenceID,
			&item.Name,
			&item.Type,
			&item.TargetType,
			&item.TargetValue,
			&item.TotalValue,
			&item.SkippedDays,
			&item.SuccessfulDays,
			&item.IncompleteDays,
			&item.MissedDays,
		); err != nil {
			return WeekResponse{}, fmt.Errorf("scan week recap: %w", err)
		}
		response.Cadences = append(response.Cadences, item)
	}

	if err := rows.Err(); err != nil {
		return WeekResponse{}, fmt.Errorf("iterate week recap: %w", err)
	}

	return response, nil
}
