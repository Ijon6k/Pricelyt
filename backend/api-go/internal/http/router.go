package http

import (
	"api/internal/auth"
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
	apiMux.HandleFunc("GET /health", health.Handler(db))

	// auth
	authRepo := auth.NewRepository(db)
	authHandler := auth.NewHandler(authRepo)
	apiMux.HandleFunc("POST /auth/register", authHandler.Register)
	apiMux.HandleFunc("POST /auth/login", authHandler.Login)

	// tracker
	repo := tracker.NewRepository(db)
	service := tracker.NewService(repo)
	handler := tracker.NewHandler(service)

	apiMux.HandleFunc("GET /trackers", handler.GetTrackers)
	apiMux.HandleFunc("POST /trackers", mw.AuthRequired(handler.AddTracker))
	apiMux.HandleFunc("GET /trackers/{id}", handler.GetTrackerByID)
	apiMux.HandleFunc("PATCH /trackers/{id}", mw.AuthRequired(handler.UpdateScrapeInterval))
	apiMux.HandleFunc("DELETE /trackers/{id}", mw.AdminOnly(handler.DeleteTracker))

	rootMux.Handle("/api/", http.StripPrefix("/api", apiMux))
	return mw.RateLimiterConfig(rootMux)
}
