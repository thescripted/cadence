package app

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewMux(dbPool *pgxpool.Pool, defaultUserID int64) http.Handler {
	mux := http.NewServeMux()
	healthHandler := HealthHandler{DB: dbPool}
	cadenceHandler := NewCadenceHandler(NewCadenceRepository(dbPool), defaultUserID)
	todayHandler := NewTodayHandler(NewTodayRepository(dbPool), defaultUserID)
	recapHandler := NewRecapHandler(NewRecapRepository(dbPool), defaultUserID)

	mux.HandleFunc("GET /healthz", healthHandler.Live)
	mux.HandleFunc("GET /readyz", healthHandler.Ready)
	mux.HandleFunc("GET /habits", cadenceHandler.List)
	mux.HandleFunc("POST /habits", cadenceHandler.Create)
	mux.HandleFunc("PATCH /habits/{id}", cadenceHandler.Update)
	mux.HandleFunc("GET /today", todayHandler.Get)
	mux.HandleFunc("PUT /today/log", todayHandler.UpdateLog)
	mux.HandleFunc("PUT /today/note", todayHandler.UpdateNote)
	mux.HandleFunc("GET /recap/week", recapHandler.Week)

	return withCORS(mux)
}
