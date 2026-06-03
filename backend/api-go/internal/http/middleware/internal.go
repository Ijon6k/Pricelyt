package middleware

import (
	"net/http"
	"os"
)

// InternalOrAuth checks for a valid X-Internal-Key header first.
// If present and matches INTERNAL_API_KEY env var, passes the request through
// WITHOUT setting user context (internal service call).
// Otherwise falls through to the standard auth middleware.
// This allows both user-triggered (authenticated) and worker-triggered
// (internal) calls to the same endpoint.
func InternalOrAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		internalKey := os.Getenv("INTERNAL_API_KEY")
		if internalKey != "" {
			key := r.Header.Get("X-Internal-Key")
			if key == internalKey {
				next(w, r)
				return
			}
		}

		AuthRequired(next)(w, r)
	}
}
