package tracker

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll() ([]Tracker, error) {
	var trackers []Tracker

	query := `
        SELECT id, keyword, status, created_at, view_count
        FROM trackers
        ORDER BY created_at DESC
    `

	err := r.db.Select(&trackers, query)
	if err != nil {
		return nil, err
	}

	return trackers, nil
}

func (r *Repository) FindByID(id string) (*Tracker, error) {
	var t Tracker

	query := `
        SELECT
            id, keyword, status, created_at, view_count,
            error_count, last_error_code, last_error_message, last_error_at
        FROM trackers
        WHERE id = $1
        LIMIT 1
    `

	if err := r.db.Get(&t, query, id); err != nil {
		return nil, err
	}

	return &t, nil
}

func (r *Repository) IncrementViewCount(id string) error {
	query := `
		UPDATE trackers
		SET view_count = view_count + 1
		WHERE id = $1
	`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *Repository) FindPriceLogs(trackerID string) ([]PriceLog, error) {
	var logs []PriceLog
	query := `
		SELECT id, market_price, min_price, max_price, median_price, sample_count, scraped_at
		FROM price_logs
		WHERE tracker_id = $1
		ORDER BY scraped_at ASC
	`
	err := r.db.Select(&logs, query, trackerID)
	return logs, err
}

func (r *Repository) FindNewsLogs(trackerID string) ([]NewsLog, error) {
	var logs []NewsLog
	query := `
		SELECT id, title, source_url, content, is_blocked, scraped_at
		FROM news_logs
		WHERE tracker_id = $1
		ORDER BY scraped_at DESC
		LIMIT 50
	`
	err := r.db.Select(&logs, query, trackerID)
	return logs, err
}

func (r *Repository) AddTracker(ctx context.Context, keyword string) (*Tracker, error) {
	var t Tracker
	query := `
		INSERT INTO trackers (keyword, status)
		VALUES ($1, 'PENDING')
		RETURNING id, keyword, status,created_at, view_count	`

	err := r.db.QueryRowContext(ctx, query, keyword).Scan(&t.ID, &t.Keyword, &t.Status, &t.CreatedAt, &t.ViewCount)

	if err != nil {
		return nil, err
	}

	return &t, nil
}
