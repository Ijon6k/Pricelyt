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

	// profile (authenticated)
	apiMux.HandleFunc("GET /profile", mw.AuthRequired(authHandler.GetProfile))
	apiMux.HandleFunc("PUT /profile", mw.AuthRequired(authHandler.UpdateProfile))
	apiMux.HandleFunc("PUT /profile/password", mw.AuthRequired(authHandler.ChangePassword))

	// tracker
	repo := tracker.NewRepository(db)
	service := tracker.NewService(repo)
	handler := tracker.NewHandler(service)

	apiMux.HandleFunc("GET /trackers", handler.GetTrackers)
	apiMux.HandleFunc("POST /trackers", mw.AuthRequired(handler.AddTracker))
	apiMux.HandleFunc("GET /trackers/{id}", handler.GetTrackerByID)
	apiMux.HandleFunc("PATCH /trackers/{id}", mw.AuthRequired(handler.UpdateScrapeInterval))
	apiMux.HandleFunc("DELETE /trackers/{id}", mw.AuthRequired(handler.DeleteTracker))

	// share links
	apiMux.HandleFunc("POST /trackers/{id}/share", mw.AuthRequired(handler.CreateShareLink))
	apiMux.HandleFunc("GET /trackers/{id}/share", mw.AuthRequired(handler.GetShareLink))
	apiMux.HandleFunc("DELETE /trackers/{id}/share", mw.AuthRequired(handler.DeleteShareLink))

	// public share view (no auth required)
	apiMux.HandleFunc("GET /share/{token}", handler.GetSharedTracker)

	// user stats & trackers (authenticated)
	apiMux.HandleFunc("GET /profile/stats", mw.AuthRequired(handler.GetProfileStats))
	apiMux.HandleFunc("GET /profile/trackers", mw.AuthRequired(handler.GetUserTrackers))

	// summary (authenticated — regenerate on demand)
	apiMux.HandleFunc("POST /trackers/{id}/summary", mw.AuthRequired(handler.GenerateSummary))

	rootMux.Handle("/api/", http.StripPrefix("/api", apiMux))
	return rootMux
}
