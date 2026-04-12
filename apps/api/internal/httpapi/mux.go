package httpapi

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thescripted/habit-tracking/apps/api/internal/habits"
	"github.com/thescripted/habit-tracking/apps/api/internal/health"
	"github.com/thescripted/habit-tracking/apps/api/internal/recap"
	"github.com/thescripted/habit-tracking/apps/api/internal/today"
)

func NewMux(dbPool *pgxpool.Pool, defaultUserID int64) http.Handler {
	mux := http.NewServeMux()
	healthHandler := health.Handler{DB: dbPool}
	habitsHandler := NewHabitsHandler(habits.NewRepository(dbPool), defaultUserID)
	todayHandler := NewTodayHandler(today.NewRepository(dbPool), defaultUserID)
	recapHandler := NewRecapHandler(recap.NewRepository(dbPool), defaultUserID)

	mux.HandleFunc("GET /healthz", healthHandler.Live)
	mux.HandleFunc("GET /readyz", healthHandler.Ready)
	mux.HandleFunc("GET /habits", habitsHandler.List)
	mux.HandleFunc("POST /habits", habitsHandler.Create)
	mux.HandleFunc("PATCH /habits/{id}", habitsHandler.Update)
	mux.HandleFunc("GET /today", todayHandler.Get)
	mux.HandleFunc("PUT /today/log", todayHandler.UpdateLog)
	mux.HandleFunc("PUT /today/note", todayHandler.UpdateNote)
	mux.HandleFunc("GET /recap/week", recapHandler.Week)

	return withCORS(mux)
}
