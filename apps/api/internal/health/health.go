package health

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

func (h Handler) Live(w http.ResponseWriter, _ *http.Request) {
	writeHealthJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

func (h Handler) Ready(w http.ResponseWriter, _ *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := h.DB.Ping(ctx); err != nil {
		writeHealthJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "database_unavailable",
		})
		return
	}

	writeHealthJSON(w, http.StatusOK, map[string]string{
		"status": "ready",
	})
}

func writeHealthJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
