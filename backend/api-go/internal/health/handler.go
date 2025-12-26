package health

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
)

func Handler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := "ok"
		dbStatus := "connected"

		if err := db.Ping(); err != nil {
			status = "degraded"
			dbStatus = "down"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":   status,
			"database": dbStatus,
		})
	}
}
