package app

import (
	"errors"
	"net/http"
	"strconv"
)

type CadenceHandler struct {
	repo   CadenceRepository
	userID int64
}

func NewCadenceHandler(repo CadenceRepository, userID int64) CadenceHandler {
	return CadenceHandler{repo: repo, userID: userID}
}

func (h CadenceHandler) List(w http.ResponseWriter, r *http.Request) {
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

func (h CadenceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input CreateCadenceInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	item, err := h.repo.Create(r.Context(), h.userID, input)
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

	writeJSON(w, http.StatusCreated, item)
}

func (h CadenceHandler) Update(w http.ResponseWriter, r *http.Request) {
	cadenceID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || cadenceID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid cadence id",
		})
		return
	}

	var input UpdateCadenceInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	item, err := h.repo.Update(r.Context(), h.userID, cadenceID, input)
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

	writeJSON(w, http.StatusOK, item)
}

func isValidationError(err error) bool {
	return errors.Is(err, ErrInvalidInput)
}
