package main

import (
	"log/slog"
	"net/http"
	"os"
	"strings"

	"api/internal/auth"
	"api/internal/db"
	apihttp "api/internal/http"
	mw "api/internal/http/middleware"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Structured JSON logger
	logger := slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	_ = godotenv.Load("../../../.env")

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		slog.Error("DATABASE_URL is not set")
		os.Exit(1)
	}

	conn, err := db.NewPostgres(dsn)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	var addr, dbname string
	err = conn.QueryRow(
		"SELECT inet_server_addr()::text, current_database()",
	).Scan(&addr, &dbname)
	if err != nil {
		slog.Error("failed to query db info", "error", err)
		os.Exit(1)
	}

	slog.Info("connected to database",
		"address", addr,
		"database", dbname,
	)

	// Init JWT secret — require it in production
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "pricelyt-jwt-secret-change-in-production"
		slog.Warn("JWT_SECRET not set — using default (insecure, dev only)")
	}
	auth.Init(jwtSecret)

	router := apihttp.NewRouter(conn)

	// Allowed CORS origins come from env (comma-separated).
	origins := []string{"http://localhost:3000", "http://localhost:4444"}
	if env := os.Getenv("CORS_ORIGINS"); env != "" {
		origins = strings.Split(env, ",")
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Authorization", "X-Admin-Key"},
		AllowCredentials: true,
		MaxAge:           86400, // Cache preflight for 24h
	})

	// Middleware chain: security headers → body size limit → CORS → rate limit → router
	handler := mw.SecurityHeaders(
		mw.BodySizeLimit(
			mw.RateLimiterConfig(
				c.Handler(router),
			),
		),
	)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("API starting", "port", port)

	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
