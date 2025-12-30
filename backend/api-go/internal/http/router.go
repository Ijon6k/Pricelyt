package http

import (
	"api/internal/health"
	"api/internal/tracker"
	"net/http"

	"github.com/jmoiron/sqlx"
)

func NewRouter(db *sqlx.DB) http.Handler {
	mux := http.NewServeMux()

	// health
	mux.HandleFunc(" GET /health", health.Handler(db))

	// tracker
	repo := tracker.NewRepository(db)
	service := tracker.NewService(repo)
	handler := tracker.NewHandler(service)

	mux.HandleFunc("GET /trackers", handler.GetTrackers)
	mux.HandleFunc("POST /trackers", handler.AddTracker)
	mux.HandleFunc("GET /trackers/{id}", handler.GetTrackerByID)
	return mux
}
