package http

import (
	"net/http"

	"api/internal/health"
)

func NewRouter() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", health.Handler)

	return mux
}
