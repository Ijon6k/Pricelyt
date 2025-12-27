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
	mux.HandleFunc("/health", health.Handler(db))

	// tracker
	repo := tracker.NewRepository(db)
	service := tracker.NewService(repo)
	handler := tracker.NewHandler(service)
	//list trackers
	mux.HandleFunc("/trackers", handler.GetTrackers)

	mux.HandleFunc("/trackers/", handler.GetTrackerByID)

	return mux
}
