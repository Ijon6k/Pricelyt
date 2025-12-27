package tracker

// buat selection db
type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListTrackers() ([]Tracker, error) {
	return s.repo.FindAll()
}

func (s *Service) GetTrackerByID(id string) (*Tracker, error) {
	if err := s.repo.IncrementViewCount(id); err != nil {
		return nil, err
	}

	return s.repo.FindByID(id)

}

func (s *Service) GetTrackerDetailByID(id string) (*TrackerDetail, error) {
	// Increment view count
	if err := s.repo.IncrementViewCount(id); err != nil {
		return nil, err
	}

	t, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	prices, _ := s.repo.FindPriceLogs(id)
	news, _ := s.repo.FindNewsLogs(id)

	return &TrackerDetail{
		Tracker:   *t,
		PriceLogs: prices,
		NewsLogs:  news,
	}, nil
}
