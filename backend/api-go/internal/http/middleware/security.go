package middleware

import (
	"net/http"
)

// SecurityHeaders adds standard security headers to all responses.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")
		// Prevent clickjacking
		w.Header().Set("X-Frame-Options", "DENY")
		// XSS protection (legacy but still useful)
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		// Referrer policy — send origin only on cross-origin
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		// Permissions policy — disable unnecessary browser features
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		// Content Security Policy — relaxed for Next.js SSR
		w.Header().Set("Content-Security-Policy",
			"default-src 'self'; "+
				"script-src 'self' 'unsafe-inline' 'unsafe-eval'; "+
				"style-src 'self' 'unsafe-inline'; "+
				"img-src 'self' data: https:; "+
				"font-src 'self' data:; "+
				"connect-src 'self'; "+
				"frame-ancestors 'none'")

		next.ServeHTTP(w, r)
	})
}

// BodySizeLimit limits the maximum request body size.
// 1MB for most endpoints, which is more than enough for JSON API calls.
func BodySizeLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Limit request body to 1MB
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB
		next.ServeHTTP(w, r)
	})
}
