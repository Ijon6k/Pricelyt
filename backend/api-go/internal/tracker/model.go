package tracker

import "time"

type Tracker struct {
	ID                    string     `db:"id" json:"id"`
	Keyword               string     `db:"keyword" json:"keyword"`
	Status                string     `db:"status" json:"status"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
	ViewCount             int        `db:"view_count" json:"view_count"`
	ErrorCount            int        `db:"error_count" json:"error_count"`
	LastErrorCode         *string    `db:"last_error_code" json:"last_error_code"`
	LastErrorMessage      *string    `db:"last_error_message" json:"last_error_message"`
	LastErrorAt           *time.Time `db:"last_error_at" json:"last_error_at"`
	ScrapeIntervalMinutes int        `db:"scrape_interval_minutes" json:"scrape_interval_minutes"`
	LastScrapedAt         *time.Time `db:"last_scraped_at" json:"last_scraped_at"`
	UserID                *string    `db:"user_id" json:"user_id"`
	UserName              string     `db:"user_name" json:"user_name"`
}

type PriceLog struct {
	ID          string    `db:"id" json:"id"`
	MarketPrice float64   `db:"market_price" json:"market_price"`
	MinPrice    float64   `db:"min_price" json:"min_price"`
	MaxPrice    float64   `db:"max_price" json:"max_price"`
	MedianPrice *float64  `db:"median_price" json:"median_price"`
	SampleCount int       `db:"sample_count" json:"sample_count"`
	Currency    string    `db:"currency" json:"currency"`
	Source      string    `db:"source" json:"source"`
	ScrapedAt   time.Time `db:"scraped_at" json:"scraped_at"`
}

type NewsLog struct {
	ID        string    `db:"id" json:"id"`
	Title     string    `db:"title" json:"title"`
	SourceURL string    `db:"source_url" json:"source_url"`
	Content   string    `db:"content" json:"content"`
	IsBlocked bool      `db:"is_blocked" json:"is_blocked"`
	ScrapedAt time.Time `db:"scraped_at" json:"scraped_at"`
}

type TrackerDetail struct {
	Tracker
	PriceLogs []PriceLog `json:"price_logs"`
	NewsLogs  []NewsLog  `json:"news_logs"`
	ShareLink *ShareLink `json:"share_link,omitempty"`
}

type ShareLink struct {
	ID        string    `db:"id" json:"id"`
	TrackerID string    `db:"tracker_id" json:"tracker_id"`
	Token     string    `db:"token" json:"token"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type UserStats struct {
	TotalTrackers  int `db:"total_trackers" json:"total_trackers"`
	ActiveTrackers int `db:"active_trackers" json:"active_trackers"`
	TotalViews     int `db:"total_views" json:"total_views"`
	TotalDataPoints int `db:"total_data_points" json:"total_data_points"`
}
