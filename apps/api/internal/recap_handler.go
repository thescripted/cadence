package app

import (
	"net/http"
	"time"
)

type RecapHandler struct {
	repo   RecapRepository
	userID int64
}

func NewRecapHandler(repo RecapRepository, userID int64) RecapHandler {
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
