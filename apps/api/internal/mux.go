package app

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type routeDef struct {
	method  string
	path    string
	handler http.HandlerFunc
}

func route(mux *http.ServeMux, prefix string, routes []routeDef) {
	for _, route := range routes {
		mux.HandleFunc(route.method+" "+prefix+route.path, route.handler)
	}
}

func NewMux(dbPool *pgxpool.Pool, defaultUserID int64) http.Handler {
	mux := http.NewServeMux()
	health := Health{DB: dbPool}
	cadence := NewCadence(NewCadenceRepository(dbPool), defaultUserID)
	today := NewToday(NewTodayRepository(dbPool), defaultUserID)
	recap := NewRecap(NewRecapRepository(dbPool), defaultUserID)

	route(mux, "", health.routes())
	route(mux, "/habits", cadence.routes())
	route(mux, "/today", today.routes())
	route(mux, "/recap", recap.routes())

	return withCORS(mux)
}
