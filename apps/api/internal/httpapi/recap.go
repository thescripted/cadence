package httpapi

import (
	"net/http"
	"time"

	"github.com/thescripted/habit-tracking/apps/api/internal/recap"
)

type RecapHandler struct {
	repo   recap.Repository
	userID int64
}

func NewRecapHandler(repo recap.Repository, userID int64) RecapHandler {
	return RecapHandler{repo: repo, userID: userID}
}

func (h RecapHandler) Week(w http.ResponseWriter, r *http.Request) {
	response, err := h.repo.Week(r.Context(), h.userID, time.Now())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, response)
}
