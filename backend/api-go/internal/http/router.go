package http

import (
	"net/http"

	"api/internal/health"

	"github.com/jmoiron/sqlx"
)

func NewRouter(db *sqlx.DB) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", health.Handler(db))

	return mux
}
