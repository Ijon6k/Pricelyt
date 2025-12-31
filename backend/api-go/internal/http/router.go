package http

import (
	"api/internal/health"
	mw "api/internal/http/middleware"
	"api/internal/tracker"
	"net/http"

	"github.com/jmoiron/sqlx"
)

func NewRouter(db *sqlx.DB) http.Handler {
	rootMux := http.NewServeMux()

	apiMux := http.NewServeMux()

	// health
	apiMux.HandleFunc(" GET /health", health.Handler(db))

	// tracker
	repo := tracker.NewRepository(db)
	service := tracker.NewService(repo)
	handler := tracker.NewHandler(service)

	apiMux.HandleFunc("GET /trackers", handler.GetTrackers)
	apiMux.HandleFunc("POST /trackers", handler.AddTracker)
	apiMux.HandleFunc("GET /trackers/{id}", handler.GetTrackerByID)
	apiMux.HandleFunc("DELETE /trackers/{id}", mw.AdminOnly(handler.DeleteTracker))

	rootMux.Handle("/api/", http.StripPrefix("/api", apiMux))
	return mw.RateLimiterConfig(rootMux)
}
