package middleware

import (
	"net/http"
	"os"
)

func AdminOnly(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expected := os.Getenv("ADMIN_KEY")
		if expected == "" {
			// If ADMIN_KEY is not set, deny all admin requests.
			// Never fall back to a known default in production.
			http.Error(w, `{"error":"admin access not configured"}`, http.StatusForbidden)
			return
		}

		key := r.Header.Get("X-Admin-Key")
		if key == "" || key != expected {
			http.Error(w, `{"error":"admin only"}`, http.StatusForbidden)
			return
		}

		next(w, r)
	}
}
