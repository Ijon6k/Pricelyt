package middleware

import (
	"net/http"
	"os"
)

func AdminOnly(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expected := os.Getenv("ADMIN_KEY")
		if expected == "" {
			expected = "change-me"
		}

		key := r.Header.Get("X-Admin-Key")

		if key != expected {
			http.Error(w, "admin only", http.StatusForbidden)
			return
		}

		next(w, r)
	}
}
