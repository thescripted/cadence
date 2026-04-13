package app

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrInvalidInput = errors.New("invalid cadence input")

type Cadence struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Unit         *string   `json:"unit"`
	TargetType   string    `json:"targetType"`
	TargetValue  *int      `json:"targetValue"`
	DisplayOrder int       `json:"displayOrder"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type CreateCadenceInput struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Unit         *string `json:"unit"`
	TargetType   string  `json:"targetType"`
	TargetValue  *int    `json:"targetValue"`
	DisplayOrder int     `json:"displayOrder"`
}

type UpdateCadenceInput struct {
	Name         *string `json:"name"`
	Type         *string `json:"type"`
	Unit         *string `json:"unit"`
	TargetType   *string `json:"targetType"`
	TargetValue  *int    `json:"targetValue"`
	DisplayOrder *int    `json:"displayOrder"`
	IsActive     *bool   `json:"isActive"`
	IsArchived   *bool   `json:"isArchived"`
}

type CadenceRepository struct {
	db *pgxpool.Pool
}

func NewCadenceRepository(db *pgxpool.Pool) CadenceRepository {
	return CadenceRepository{db: db}
}

func (r CadenceRepository) Create(ctx context.Context, userID int64, input CreateCadenceInput) (Cadence, error) {
	if err := validateCreateCadence(input); err != nil {
		return Cadence{}, err
	}

	row := r.db.QueryRow(ctx, `
		INSERT INTO habits (user_id, name, type, unit, target_type, target_value, display_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, name, type, unit, target_type, target_value, display_order, is_active, created_at, updated_at
	`, userID, input.Name, input.Type, nullableString(input.Unit), input.TargetType, input.TargetValue, input.DisplayOrder)

	return scanCadence(row)
}

func (r CadenceRepository) List(ctx context.Context, userID int64) ([]Cadence, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, type, unit, target_type, target_value, display_order, is_active, created_at, updated_at
		FROM habits
		WHERE user_id = $1 AND archived_at IS NULL
		ORDER BY display_order ASC, id ASC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("list cadences: %w", err)
	}
	defer rows.Close()

	cadences := make([]Cadence, 0)
	for rows.Next() {
		cadence, err := scanCadence(rows)
		if err != nil {
			return nil, err
		}
		cadences = append(cadences, cadence)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate cadences: %w", err)
	}

	return cadences, nil
}

func (r CadenceRepository) Update(ctx context.Context, userID, cadenceID int64, input UpdateCadenceInput) (Cadence, error) {
	current, err := r.GetByID(ctx, userID, cadenceID)
	if err != nil {
		return Cadence{}, err
	}

	merged := CreateCadenceInput{
		Name:         current.Name,
		Type:         current.Type,
		Unit:         current.Unit,
		TargetType:   current.TargetType,
		TargetValue:  current.TargetValue,
		DisplayOrder: current.DisplayOrder,
	}

	if input.Name != nil {
		merged.Name = *input.Name
	}
	if input.Type != nil {
		merged.Type = *input.Type
	}
	if input.Unit != nil {
		merged.Unit = input.Unit
	}
	if input.TargetType != nil {
		merged.TargetType = *input.TargetType
	}
	if input.TargetValue != nil {
		merged.TargetValue = input.TargetValue
	}
	if input.DisplayOrder != nil {
		merged.DisplayOrder = *input.DisplayOrder
	}

	if err := validateCreateCadence(merged); err != nil {
		return Cadence{}, err
	}

	isActive := current.IsActive
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	if input.IsArchived != nil {
		if *input.IsArchived {
			isActive = false
		}
	}

	row := r.db.QueryRow(ctx, `
		UPDATE habits
		SET
			name = $3,
			type = $4,
			unit = $5,
			target_type = $6,
			target_value = $7,
			display_order = $8,
			is_active = $9,
			archived_at = CASE
				WHEN $10::boolean IS NULL THEN archived_at
				WHEN $10 THEN NOW()
				ELSE NULL
			END,
			updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, name, type, unit, target_type, target_value, display_order, is_active, created_at, updated_at
	`, cadenceID, userID, merged.Name, merged.Type, nullableString(merged.Unit), merged.TargetType, merged.TargetValue, merged.DisplayOrder, isActive, input.IsArchived)

	return scanCadence(row)
}

func (r CadenceRepository) GetByID(ctx context.Context, userID, cadenceID int64) (Cadence, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, name, type, unit, target_type, target_value, display_order, is_active, created_at, updated_at
		FROM habits
		WHERE id = $1 AND user_id = $2
	`, cadenceID, userID)

	cadence, err := scanCadence(row)
	if err != nil {
		return Cadence{}, fmt.Errorf("get cadence: %w", err)
	}

	return cadence, nil
}

func validateCreateCadence(input CreateCadenceInput) error {
	if input.Name == "" {
		return fmt.Errorf("%w: name is required", ErrInvalidInput)
	}

	switch input.Type {
	case "binary":
	case "counter":
	default:
		return fmt.Errorf("%w: type must be binary or counter", ErrInvalidInput)
	}

	switch input.TargetType {
	case "complete", "at_least", "at_most", "exact":
	default:
		return fmt.Errorf("%w: targetType must be complete, at_least, at_most, or exact", ErrInvalidInput)
	}

	if input.Type == "binary" && input.TargetType != "complete" {
		return fmt.Errorf("%w: binary cadences must use targetType complete", ErrInvalidInput)
	}

	if input.Type == "counter" && input.TargetValue == nil {
		return fmt.Errorf("%w: counter cadences require targetValue", ErrInvalidInput)
	}

	if input.TargetValue != nil && *input.TargetValue < 0 {
		return fmt.Errorf("%w: targetValue must be non-negative", ErrInvalidInput)
	}

	return nil
}

func scanCadence(row interface {
	Scan(dest ...any) error
}) (Cadence, error) {
	var cadence Cadence
	var unit *string
	var targetValue *int

	if err := row.Scan(
		&cadence.ID,
		&cadence.Name,
		&cadence.Type,
		&unit,
		&cadence.TargetType,
		&targetValue,
		&cadence.DisplayOrder,
		&cadence.IsActive,
		&cadence.CreatedAt,
		&cadence.UpdatedAt,
	); err != nil {
		return Cadence{}, fmt.Errorf("scan cadence: %w", err)
	}

	cadence.Unit = unit
	cadence.TargetValue = targetValue

	return cadence, nil
}

func nullableString(value *string) any {
	if value == nil || *value == "" {
		return nil
	}

	return *value
}
