package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/didip/tollbooth/v7"
	"github.com/didip/tollbooth/v7/limiter"
)

// newLimiter creates a tollbooth limiter with the given max requests per second.
func newLimiter(max float64, errMsg string) *limiter.Limiter {
	lmt := tollbooth.NewLimiter(max, nil)
	lmt.SetMessage(`{"success":false,"error":"` + errMsg + `"}`)
	lmt.SetMessageContentType("application/json")
	return lmt
}

var (
	// Per-endpoint limiters (strict)
	authLimiter     = newLimiter(5, "Too many auth attempts. Try again later.")
	createLimiter   = newLimiter(10, "Too many trackers created. Slow down.")
	shareLimiter    = newLimiter(5, "Too many share requests.")
	passwordLimiter = newLimiter(3, "Too many password change attempts.")

	// Global: generous fallback
	globalLimiter = newLimiter(120, "Rate limit exceeded. Please try again later.")
)

// RateLimiterConfig wraps the handler with tiered rate limiting:
// 1. Per-endpoint limits (strict for sensitive operations)
// 2. Global limit (generous fallback)
func RateLimiterConfig(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		method := r.Method

		// Per-endpoint limits (check strictest first)
		var endpointLimiter *limiter.Limiter

		if strings.HasPrefix(path, "/api/auth/") {
			endpointLimiter = authLimiter
		} else if method == "PUT" && strings.HasPrefix(path, "/api/profile/password") {
			endpointLimiter = passwordLimiter
		} else if strings.HasPrefix(path, "/api/trackers/") && strings.HasSuffix(path, "/share") {
			endpointLimiter = shareLimiter
		} else if method == "POST" && path == "/api/trackers" {
			endpointLimiter = createLimiter
		}

		if endpointLimiter != nil {
			if err := tollbooth.LimitByRequest(endpointLimiter, w, r); err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "60")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"success": false,
					"error":   "Rate limit exceeded. Please try again later.",
				})
				return
			}
		}

		// Global limit
		if err := tollbooth.LimitByRequest(globalLimiter, w, r); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   "Rate limit exceeded. Please try again later.",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}
