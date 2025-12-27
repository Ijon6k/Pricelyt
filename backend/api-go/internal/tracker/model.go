package tracker

import "time"

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

type PriceLog struct {
	ID          string    `db:"id" json:"id"`
	MarketPrice int       `db:"market_price" json:"market_price"`
	MinPrice    int       `db:"min_price" json:"min_price"`
	MaxPrice    int       `db:"max_price" json:"max_price"`
	MedianPrice int       `db:"median_price" json:"median_price"`
	SampleCount int       `db:"sample_count" json:"sample_count"`
	ScrapedAt   time.Time `db:"scraped_at" json:"scraped_at"`
}

type NewsLog struct {
	ID        string `db:"id" json:"id"`
	Title     string `db:"title" json:"title"`
	SourceURL string `db:"source_url" json:"source_url"`

	Content   string    `db:"content" json:"content"`
	IsBlocked bool      `db:"is_blocked" json:"is_blocked"`
	ScrapedAt time.Time `db:"scraped_at" json:"scraped_at"`
}

// Ini menggabungkan data Tracker + Logs
type TrackerDetail struct {
	Tracker
	PriceLogs []PriceLog `json:"price_logs"`
	NewsLogs  []NewsLog  `json:"news_logs"`
}
