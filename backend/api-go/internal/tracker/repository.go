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
		SELECT id, keyword, status, created_at, view_count
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
