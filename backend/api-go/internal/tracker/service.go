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
	shareLink, _ := s.repo.GetShareLinkByTrackerID(id)

	return &TrackerDetail{
		Tracker:   *t,
		PriceLogs: prices,
		NewsLogs:  news,
		ShareLink: shareLink,
	}, nil
}

func (s *Service) AddTracker(ctx context.Context, keyword string, userID *string) (*Tracker, error) {
	keyword = strings.TrimSpace(keyword)
	if keyword == "" {
		return nil, errors.New("keyword cannot be empty")
	}
	if len(keyword) > 200 {
		return nil, errors.New("keyword must not exceed 200 characters")
	}

	return s.repo.AddTracker(ctx, keyword, userID)
}

func (s *Service) DeleteTracker(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *Service) UpdateScrapeInterval(ctx context.Context, id string, minutes int) error {
	if minutes < 5 {
		return errors.New("scrape interval must be at least 5 minutes")
	}
	if minutes > 10080 { // 7 days
		return errors.New("scrape interval must not exceed 7 days")
	}
	return s.repo.UpdateScrapeInterval(id, minutes)
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

// --- Share methods ---

func (s *Service) CreateShareLink(ctx context.Context, trackerID string) (string, error) {
	// Verify tracker exists
	_, err := s.repo.FindByID(trackerID)
	if err != nil {
		return "", errors.New("tracker not found")
	}
	return s.repo.CreateShareLink(ctx, trackerID)
}

func (s *Service) GetShareLink(trackerID string) (*ShareLink, error) {
	return s.repo.GetShareLinkByTrackerID(trackerID)
}

func (s *Service) DeleteShareLink(ctx context.Context, trackerID string) error {
	return s.repo.DeleteShareLink(ctx, trackerID)
}

func (s *Service) GetSharedTracker(token string) (*TrackerDetail, error) {
	share, err := s.repo.GetShareByToken(token)
	if err != nil {
		return nil, err
	}

	t, err := s.repo.FindByID(share.TrackerID)
	if err != nil {
		return nil, err
	}

	prices, _ := s.repo.FindPriceLogs(share.TrackerID)
	news, _ := s.repo.FindNewsLogs(share.TrackerID)

	return &TrackerDetail{
		Tracker:   *t,
		PriceLogs: prices,
		NewsLogs:  news,
	}, nil
}

// --- Profile methods ---

func (s *Service) GetUserStats(ctx context.Context, userID string) (*UserStats, error) {
	return s.repo.GetUserStats(ctx, userID)
}

func (s *Service) GetUserTrackers(ctx context.Context, userID string) ([]Tracker, error) {
	return s.repo.GetUserTrackers(ctx, userID)
}
