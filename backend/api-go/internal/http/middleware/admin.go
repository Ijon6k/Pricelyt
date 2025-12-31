package middleware

import (
	"net/http"
)

func AdminOnly(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := r.Header.Get("X-Admin-Key")

		if key != "123456" {
			http.Error(w, "admin only", http.StatusForbidden)
			return
		}

		next(w, r)
	}
}
