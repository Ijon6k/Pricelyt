package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/didip/tollbooth/v7"
)

func RateLimiterConfig(next http.Handler) http.Handler {
	// Behind a reverse proxy all requests share the proxy's IP, so the
	// per-IP bucket is effectively global. Keep this generous enough for
	// SSR + debounced client search not to trip it.
	lmt := tollbooth.NewLimiter(50, nil)

	lmt.SetOnLimitReached(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusTooManyRequests)

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Too Many Requests.",
		})
	})

	return tollbooth.LimitHandler(lmt, next)
}
