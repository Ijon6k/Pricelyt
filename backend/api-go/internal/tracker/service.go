package tracker

// Service berisi logic bisnis tracker
type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// ListTrackers mengambil semua tracker
func (s *Service) ListTrackers() ([]Tracker, error) {
	return s.repo.FindAll()
}
