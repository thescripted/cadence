package httpapi

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/thescripted/habit-tracking/apps/api/internal/habits"
)

type HabitsHandler struct {
	repo   habits.Repository
	userID int64
}

func NewHabitsHandler(repo habits.Repository, userID int64) HabitsHandler {
	return HabitsHandler{repo: repo, userID: userID}
}

func (h HabitsHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.List(r.Context(), h.userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"habits": items,
	})
}

func (h HabitsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input habits.CreateHabitInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	habit, err := h.repo.Create(r.Context(), h.userID, input)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if isValidationError(err) {
			statusCode = http.StatusBadRequest
		}

		writeJSON(w, statusCode, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusCreated, habit)
}

func (h HabitsHandler) Update(w http.ResponseWriter, r *http.Request) {
	habitID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || habitID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid habit id",
		})
		return
	}

	var input habits.UpdateHabitInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	habit, err := h.repo.Update(r.Context(), h.userID, habitID, input)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if isValidationError(err) {
			statusCode = http.StatusBadRequest
		}

		writeJSON(w, statusCode, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, habit)
}

func isValidationError(err error) bool {
	return errors.Is(err, habits.ErrInvalidInput)
}
