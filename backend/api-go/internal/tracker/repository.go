package tracker

import "github.com/jmoiron/sqlx"

// Repository bertanggung jawab akses data trackers
type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindAll() ([]Tracker, error) {
	var trackers []Tracker

	query := `
        SELECT id, keyword, status, created_at
        FROM trackers
        ORDER BY created_at DESC
    `

	err := r.db.Select(&trackers, query)
	if err != nil {
		return nil, err
	}

	return trackers, nil
}
