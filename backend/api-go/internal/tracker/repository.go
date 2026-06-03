package tracker

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

const trackerSelectCols = `
	t.id, t.keyword, t.status, t.created_at, t.view_count,
	t.error_count, t.last_error_code, t.last_error_message, t.last_error_at,
	t.scrape_interval_minutes, t.last_scraped_at,
	t.user_id, COALESCE(u.email, '') as user_name,
	t.summary, t.summary_generated_at,
	latest_prices.market_price AS latest_price,
	latest_prices.source AS latest_price_source,
	prev_prices.market_price AS previous_price,
	COALESCE(price_counts.cnt, 0) AS price_log_count`

func (r *Repository) FindAll() ([]Tracker, error) {
	var trackers []Tracker
	query := `SELECT` + trackerSelectCols + `
		FROM trackers t
		LEFT JOIN users u ON t.user_id = u.id
		LEFT JOIN LATERAL (
			SELECT market_price, source FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1
		) latest_prices ON true
		LEFT JOIN LATERAL (
			SELECT market_price FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1 OFFSET 1
		) prev_prices ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*) as cnt FROM price_logs
			WHERE tracker_id = t.id
		) price_counts ON true
		ORDER BY t.created_at DESC
	`
	err := r.db.Select(&trackers, query)
	if err != nil {
		return nil, err
	}
	return trackers, nil
}

func (r *Repository) FindByID(id string) (*Tracker, error) {
	var t Tracker
	query := `SELECT` + trackerSelectCols + `
		FROM trackers t
		LEFT JOIN users u ON t.user_id = u.id
		LEFT JOIN LATERAL (
			SELECT market_price, source FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1
		) latest_prices ON true
		LEFT JOIN LATERAL (
			SELECT market_price FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1 OFFSET 1
		) prev_prices ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*) as cnt FROM price_logs
			WHERE tracker_id = t.id
		) price_counts ON true
		WHERE t.id = $1
		LIMIT 1
	`
	if err := r.db.Get(&t, query, id); err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) IncrementViewCount(id string) error {
	query := `UPDATE trackers SET view_count = view_count + 1 WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *Repository) FindPriceLogs(trackerID string) ([]PriceLog, error) {
	var logs []PriceLog
	query := `
		SELECT id, market_price, min_price, max_price, median_price, sample_count, currency, source, scraped_at
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

func (r *Repository) AddTracker(ctx context.Context, keyword string, userID *string) (*Tracker, error) {
	var t Tracker
	query := `
		INSERT INTO trackers (keyword, status, user_id)
		VALUES ($1, 'PENDING', $2)
		RETURNING id, keyword, status, created_at, view_count,
		          error_count, last_error_code, last_error_message, last_error_at,
		          scrape_interval_minutes, last_scraped_at, user_id, summary, summary_generated_at
	`
	err := r.db.QueryRowContext(ctx, query, keyword, userID).Scan(
		&t.ID, &t.Keyword, &t.Status, &t.CreatedAt, &t.ViewCount,
		&t.ErrorCount, &t.LastErrorCode, &t.LastErrorMessage, &t.LastErrorAt,
		&t.ScrapeIntervalMinutes, &t.LastScrapedAt, &t.UserID, &t.Summary, &t.SummaryGeneratedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM trackers WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("tracker not found")
	}
	return nil
}

func (r *Repository) UpdateScrapeInterval(id string, minutes int) error {
	query := `UPDATE trackers SET scrape_interval_minutes = $1 WHERE id = $2`
	result, err := r.db.Exec(query, minutes, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("tracker not found")
	}
	return nil
}

func (r *Repository) UpdateSummary(ctx context.Context, trackerID, summary string) error {
	query := `UPDATE trackers SET summary = $1, summary_generated_at = NOW() WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, summary, trackerID)
	return err
}

func (r *Repository) Search(ctx context.Context, keyword string) ([]Tracker, error) {
	var trackers []Tracker
	query := `SELECT` + trackerSelectCols + `
		FROM trackers t
		LEFT JOIN users u ON t.user_id = u.id
		LEFT JOIN LATERAL (
			SELECT market_price, source FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1
		) latest_prices ON true
		LEFT JOIN LATERAL (
			SELECT market_price FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1 OFFSET 1
		) prev_prices ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*) as cnt FROM price_logs
			WHERE tracker_id = t.id
		) price_counts ON true
		WHERE t.keyword ILIKE $1
		ORDER BY length(t.keyword) ASC, t.created_at DESC
		LIMIT 20
	`
	searchTerm := "%" + keyword + "%"
	err := r.db.SelectContext(ctx, &trackers, query, searchTerm)
	if err != nil {
		return nil, err
	}
	if trackers == nil {
		trackers = []Tracker{}
	}
	return trackers, nil
}

// --- Share methods ---

func generateShareToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (r *Repository) CreateShareLink(ctx context.Context, trackerID string) (string, error) {
	token, err := generateShareToken()
	if err != nil {
		return "", err
	}
	query := `
		INSERT INTO shared_links (tracker_id, token)
		VALUES ($1, $2)
		ON CONFLICT (tracker_id) DO UPDATE SET token = $2, created_at = NOW()
		RETURNING token
	`
	err = r.db.QueryRowContext(ctx, query, trackerID, token).Scan(&token)
	if err != nil {
		return "", err
	}
	return token, nil
}

func (r *Repository) GetShareByToken(token string) (*ShareLink, error) {
	var s ShareLink
	query := `SELECT id, tracker_id, token, created_at FROM shared_links WHERE token = $1`
	if err := r.db.Get(&s, query, token); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("share link not found")
		}
		return nil, err
	}
	return &s, nil
}

func (r *Repository) DeleteShareLink(ctx context.Context, trackerID string) error {
	query := `DELETE FROM shared_links WHERE tracker_id = $1`
	result, err := r.db.ExecContext(ctx, query, trackerID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("share link not found")
	}
	return nil
}

func (r *Repository) GetShareLinkByTrackerID(trackerID string) (*ShareLink, error) {
	var s ShareLink
	query := `SELECT id, tracker_id, token, created_at FROM shared_links WHERE tracker_id = $1`
	if err := r.db.Get(&s, query, trackerID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

// --- Profile methods ---

func (r *Repository) GetUserStats(ctx context.Context, userID string) (*UserStats, error) {
	var stats UserStats
	query := `
		SELECT
			COUNT(*) as total_trackers,
			COUNT(*) FILTER (WHERE status = 'READY') as active_trackers,
			COALESCE(SUM(view_count), 0) as total_views
		FROM trackers
		WHERE user_id = $1
	`
	if err := r.db.GetContext(ctx, &stats, query, userID); err != nil {
		return nil, err
	}

	dataQuery := `
		SELECT COUNT(*)
		FROM price_logs pl
		JOIN trackers t ON pl.tracker_id = t.id
		WHERE t.user_id = $1
	`
	r.db.GetContext(ctx, &stats.TotalDataPoints, dataQuery, userID)

	return &stats, nil
}

func (r *Repository) GetUserTrackers(ctx context.Context, userID string) ([]Tracker, error) {
	var trackers []Tracker
	query := `SELECT` + trackerSelectCols + `
		FROM trackers t
		LEFT JOIN users u ON t.user_id = u.id
		LEFT JOIN LATERAL (
			SELECT market_price, source FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1
		) latest_prices ON true
		LEFT JOIN LATERAL (
			SELECT market_price FROM price_logs
			WHERE tracker_id = t.id
			ORDER BY scraped_at DESC LIMIT 1 OFFSET 1
		) prev_prices ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*) as cnt FROM price_logs
			WHERE tracker_id = t.id
		) price_counts ON true
		WHERE t.user_id = $1
		ORDER BY t.created_at DESC
	`
	err := r.db.SelectContext(ctx, &trackers, query, userID)
	if err != nil {
		return nil, err
	}
	if trackers == nil {
		trackers = []Tracker{}
	}
	return trackers, nil
}
