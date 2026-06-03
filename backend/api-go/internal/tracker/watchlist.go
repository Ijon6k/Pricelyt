package tracker

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
)

type Watchlist struct {
	ID        string `db:"id" json:"id"`
	UserID    string `db:"user_id" json:"user_id"`
	TrackerID string `db:"tracker_id" json:"tracker_id"`
}

type WatchlistRepository struct {
	db *sqlx.DB
}

func NewWatchlistRepository(db *sqlx.DB) *WatchlistRepository {
	return &WatchlistRepository{db: db}
}

func (r *WatchlistRepository) Add(ctx context.Context, userID, trackerID string) error {
	query := `INSERT INTO watchlists (user_id, tracker_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.db.ExecContext(ctx, query, userID, trackerID)
	return err
}

func (r *WatchlistRepository) Remove(ctx context.Context, userID, trackerID string) error {
	query := `DELETE FROM watchlists WHERE user_id = $1 AND tracker_id = $2`
	result, err := r.db.ExecContext(ctx, query, userID, trackerID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("not found")
	}
	return nil
}

func (r *WatchlistRepository) IsWatched(userID, trackerID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM watchlists WHERE user_id = $1 AND tracker_id = $2)`
	err := r.db.Get(&exists, query, userID, trackerID)
	return exists, err
}

func (r *WatchlistRepository) GetUserWatchlist(userID string) ([]Tracker, error) {
	var trackers []Tracker
	query := `SELECT` + trackerSelectCols + `
		FROM trackers t
		INNER JOIN watchlists w ON w.tracker_id = t.id
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
		WHERE w.user_id = $1
		ORDER BY w.created_at DESC
	`
	err := r.db.Select(&trackers, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return []Tracker{}, nil
		}
		return nil, err
	}
	if trackers == nil {
		trackers = []Tracker{}
	}
	return trackers, nil
}

// GetWatchlistTrackerIDs returns a set of tracker IDs watched by user
func (r *WatchlistRepository) GetWatchlistTrackerIDs(userID string) (map[string]bool, error) {
	var ids []string
	query := `SELECT tracker_id FROM watchlists WHERE user_id = $1`
	err := r.db.Select(&ids, query, userID)
	if err != nil {
		return nil, err
	}
	m := make(map[string]bool, len(ids))
	for _, id := range ids {
		m[id] = true
	}
	return m, nil
}
