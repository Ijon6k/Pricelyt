package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/didip/tollbooth/v7"
)

func RateLimiterConfig(next http.Handler) http.Handler {
	lmt := tollbooth.NewLimiter(3, nil)

	lmt.SetOnLimitReached(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Too Many Requests.",
		})
	})

	return tollbooth.LimitHandler(lmt, next)
}
