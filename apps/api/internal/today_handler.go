package app

import (
	"errors"
	"net/http"
	"time"
)

type TodayHandler struct {
	repo   TodayRepository
	userID int64
}

func NewTodayHandler(repo TodayRepository, userID int64) TodayHandler {
	return TodayHandler{repo: repo, userID: userID}
}

func (h TodayHandler) Get(w http.ResponseWriter, r *http.Request) {
	response, err := h.repo.Get(r.Context(), h.userID, time.Now())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, response)
}

func (h TodayHandler) UpdateLog(w http.ResponseWriter, r *http.Request) {
	var input UpdateLogInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	response, err := h.repo.UpdateLog(r.Context(), h.userID, time.Now(), input)
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

func (h TodayHandler) UpdateNote(w http.ResponseWriter, r *http.Request) {
	var input UpdateNoteInput
	if err := decodeJSON(r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON payload",
		})
		return
	}

	response, err := h.repo.UpdateNote(r.Context(), h.userID, time.Now(), input)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, response)
}
