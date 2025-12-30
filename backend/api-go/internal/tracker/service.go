package tracker

import (
	"context"
	"errors"
	"strings"
)

type SearchResponse struct {
	MatchType string    `json:"match_type"`
	Query     string    `json:"query"`
	Results   []Tracker `json:"results"`
}

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

func (s *Service) SearchTracker(ctx context.Context, query string) (*SearchResponse, error) {
	trackers, err := s.repo.Search(ctx, query)
	if err != nil {
		return nil, err
	}

	response := &SearchResponse{
		Query:   query,
		Results: trackers,
	}

	if len(trackers) == 0 {
		response.MatchType = "NONE"
		return response, nil
	}

	isExact := false
	queryLower := strings.ToLower(query)

	for _, t := range trackers {
		if strings.ToLower(t.Keyword) == queryLower {
			isExact = true
			break
		}
	}

	if isExact {
		response.MatchType = "EXACT"
	} else {
		response.MatchType = "PARTIAL"
	}
	return response, nil
}
