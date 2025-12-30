package tracker

import (
	"context"
	"errors"
)

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

func (s *Service) AddTracker(ctx context.Context, keyword string) (*Tracker, error) {
	if keyword == "" {
		return nil, errors.New("keyword cannot be empty")
	}

	result, err := s.repo.AddTracker(ctx, keyword)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (s *Service) DeleteTracker(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
