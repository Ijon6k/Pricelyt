package tracker

import "time"

// Tracker merepresentasikan satu row di tabel trackers
type Tracker struct {
	ID               string     `db:"id" json:"id"`
	Keyword          string     `db:"keyword" json:"keyword"`
	Status           string     `db:"status" json:"status"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	ViewCount        int        `db:"view_count" json:"view_count"`
	ErrorCount       int        `db:"error_count" json:"error_count"`
	LastErrorCode    *string    `db:"last_error_code" json:"last_error_code"`
	LastErrorMessage *string    `db:"last_error_message" json:"last_error_message"`
	LastErrorAt      *time.Time `db:"last_error_at" json:"last_error_at"`
}
