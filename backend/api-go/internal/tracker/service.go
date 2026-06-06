package tracker

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
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

func (s *Service) DeleteTracker(ctx context.Context, id, userID string) error {
	t, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("tracker not found")
	}
	if t.UserID != nil && *t.UserID != userID {
		return errors.New("forbidden")
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) UpdateScrapeInterval(ctx context.Context, id, userID string, minutes int) error {
	if minutes < 5 {
		return errors.New("scrape interval must be at least 5 minutes")
	}
	if minutes > 10080 {
		return errors.New("scrape interval must not exceed 7 days")
	}
	t, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("tracker not found")
	}
	if t.UserID != nil && *t.UserID != userID {
		return errors.New("forbidden")
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

func (s *Service) CreateShareLink(ctx context.Context, trackerID, userID string) (string, error) {
	t, err := s.repo.FindByID(trackerID)
	if err != nil {
		return "", errors.New("tracker not found")
	}
	// Ownership check: only the tracker owner can create a share link
	if t.UserID != nil && *t.UserID != userID {
		return "", errors.New("forbidden")
	}
	return s.repo.CreateShareLink(ctx, trackerID)
}

func (s *Service) GetShareLink(trackerID, userID string) (*ShareLink, error) {
	t, err := s.repo.FindByID(trackerID)
	if err != nil {
		return nil, errors.New("tracker not found")
	}
	// Ownership check: only the tracker owner can see share link details
	if t.UserID != nil && *t.UserID != userID {
		return nil, errors.New("forbidden")
	}
	return s.repo.GetShareLinkByTrackerID(trackerID)
}

func (s *Service) DeleteShareLink(ctx context.Context, trackerID, userID string) error {
	t, err := s.repo.FindByID(trackerID)
	if err != nil {
		return errors.New("tracker not found")
	}
	// Ownership check: only the tracker owner can delete a share link
	if t.UserID != nil && *t.UserID != userID {
		return errors.New("forbidden")
	}
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

// --- Summary generation ---

// GenerateSummary creates a natural language summary from price data + news.
// Template-based — no LLM API needed. Stored in DB, served to all users.
// Requires at least 3 data points to generate a meaningful summary.
func (s *Service) GenerateSummary(ctx context.Context, trackerID, userID string) error {
	t, err := s.repo.FindByID(trackerID)
	if err != nil {
		return errors.New("tracker not found")
	}
	// Ownership check: skip for internal (worker) calls where userID is empty
	if userID != "" && t.UserID != nil && *t.UserID != userID {
		return errors.New("forbidden")
	}

	prices, _ := s.repo.FindPriceLogs(trackerID)
	news, _ := s.repo.FindNewsLogs(trackerID)

	// Validation: require at least 3 price data points for a useful summary
	if len(prices) < 3 {
		return fmt.Errorf("insufficient data: need at least 3 price data points, got %d", len(prices))
	}

	summary := buildSummary(t.Keyword, prices, news)

	return s.repo.UpdateSummary(ctx, trackerID, summary)
}

// buildSummary constructs a human-readable summary from price + news data.
// Output structure:
//   - Line 1: **Keyword** — Market Intelligence Summary (header)
//   - Line 2: Bold one-liner insight (displayed as headline on frontend)
//   - Line 3: --- (separator)
//   - Rest: Detailed sections (collapsible on frontend)
func buildSummary(keyword string, prices []PriceLog, news []NewsLog) string {
	var b strings.Builder

	// Header
	b.WriteString(fmt.Sprintf("**%s** — Market Intelligence Summary\n\n", strings.Title(strings.ToLower(keyword))))

	// --- EARLY RETURN: no price data ---
	// This line is extracted by the frontend as the prominent insight
	if len(prices) == 0 {
		b.WriteString("No price data available yet. The tracker is waiting for its first scrape cycle.\n")
		if len(news) > 0 {
			b.WriteString(fmt.Sprintf("\n%d news article(s) have been collected.\n", len(news)))
		}
		b.WriteString("\n---\n")
		b.WriteString(fmt.Sprintf("*Generated by Pricelyt · 0 price snapshots · %d news articles · %s*\n",
			len(news), time.Now().Format("Jan 2, 2006 3:04 PM")))
		return b.String()
	}

	latest := prices[len(prices)-1]
	earliest := prices[0]
	allPrices := make([]float64, len(prices))
	for i, p := range prices {
		allPrices[i] = p.MarketPrice
	}
	avg := mean(allPrices)
	minP := min(allPrices)
	maxP := max(allPrices)
	changeFromFirst := (latest.MarketPrice - earliest.MarketPrice) / earliest.MarketPrice * 100

	// --- ONE-LINER HEADLINE ---
	if len(prices) >= 3 {
		slope := linearSlope(allPrices)
		deviation := (latest.MarketPrice - avg) / avg * 100

		// Build a concise one-liner
		var trend, deal string
		if slope > 0.5 {
			trend = fmt.Sprintf("trending up +%.1f%%", changeFromFirst)
		} else if slope < -0.5 {
			trend = fmt.Sprintf("trending down %.1f%%", changeFromFirst)
		} else {
			trend = "stable pricing"
		}

		if deviation < -5 {
			deal = fmt.Sprintf("%.0f%% below average — good deal", math.Abs(deviation))
		} else if deviation > 5 {
			deal = fmt.Sprintf("%.0f%% above average", deviation)
		} else {
			deal = "near average"
		}

		b.WriteString(fmt.Sprintf("**$%.2f** · %s · %s\n", latest.MarketPrice, trend, deal))
	} else {
		b.WriteString(fmt.Sprintf("**$%.2f** · %d data points collected\n", latest.MarketPrice, len(prices)))
	}

	b.WriteString("\n---\n\n")

	// --- Price Analysis ---
	b.WriteString("## Price Analysis\n\n")

	volatility := stddev(allPrices) / avg * 100

	// Current price
	b.WriteString(fmt.Sprintf("Current market price is **$%.2f** (source: %s). ", latest.MarketPrice, latest.Source))

	// Price range
	if maxP-minP > 1 {
		b.WriteString(fmt.Sprintf("Historical range: $%.2f – $%.2f across %d data points.\n\n", minP, maxP, len(prices)))
	} else {
		b.WriteString(fmt.Sprintf("Price has been stable across %d data points.\n\n", len(prices)))
	}

	// Trend analysis
	if len(prices) >= 3 {
		slope := linearSlope(allPrices)
		changeFromFirst := (latest.MarketPrice - earliest.MarketPrice) / earliest.MarketPrice * 100

		b.WriteString("**Trend:** ")
		if slope > 0.5 {
			b.WriteString(fmt.Sprintf("Prices are trending **upward** (+%.1f%% over the tracking period). ", changeFromFirst))
			if changeFromFirst > 10 {
				b.WriteString("This may not be the best time to buy — consider waiting for a dip.")
			} else {
				b.WriteString("The increase is moderate; if you need the product soon, current pricing is reasonable.")
			}
		} else if slope < -0.5 {
			b.WriteString(fmt.Sprintf("Prices are trending **downward** (%.1f%% over the tracking period). ", changeFromFirst))
			if changeFromFirst < -10 {
				b.WriteString("This could be a good buying opportunity — the price has dropped significantly.")
			} else {
				b.WriteString("The decline is modest; prices may continue to fall or stabilize.")
			}
		} else {
			b.WriteString(fmt.Sprintf("Prices have been **relatively stable** (%.1f%% change). ", changeFromFirst))
			b.WriteString("No strong directional trend detected — this appears to be a fair market price.")
		}
		b.WriteString("\n\n")
	}

	// Deal assessment
	if len(prices) >= 3 {
		b.WriteString("**Deal Assessment:** ")
		deviation := (latest.MarketPrice - avg) / avg * 100
		if deviation < -5 {
			b.WriteString(fmt.Sprintf("Current price is **%.1f%% below average** ($%.2f). This is a good deal.\n\n", math.Abs(deviation), avg))
		} else if deviation > 5 {
			b.WriteString(fmt.Sprintf("Current price is **%.1f%% above average** ($%.2f). Consider waiting if not urgent.\n\n", deviation, avg))
		} else {
			b.WriteString(fmt.Sprintf("Current price is **near the average** ($%.2f). Fair pricing.\n\n", avg))
		}
	}

	// Volatility
	b.WriteString(fmt.Sprintf("**Volatility:** %.1f%% — ", volatility))
	if volatility < 5 {
		b.WriteString("very stable pricing. Low risk of sudden price swings.\n\n")
	} else if volatility < 15 {
		b.WriteString("moderate price fluctuation. Some variation expected.\n\n")
	} else {
		b.WriteString("high price volatility. Prices swing significantly — timing your purchase matters.\n\n")
	}

	// Data freshness
	if latest.ScrapedAt.After(time.Time{}) {
		age := time.Since(latest.ScrapedAt)
		b.WriteString(fmt.Sprintf("**Data freshness:** Last scraped %s ago. ", humanizeDuration(age)))
		if age > 48*time.Hour {
			b.WriteString("Data may be stale — prices could have changed.")
		} else {
			b.WriteString("Data is recent and reliable.")
		}
		b.WriteString("\n\n")
	}

	// --- News Summary ---
	if len(news) > 0 {
		b.WriteString("## News & Market Context\n\n")

		blockedCount := 0
		for _, n := range news {
			if n.IsBlocked {
				blockedCount++
			}
		}
		visibleNews := news
		if blockedCount > 0 {
			visibleNews = make([]NewsLog, 0, len(news))
			for _, n := range news {
				if !n.IsBlocked {
					visibleNews = append(visibleNews, n)
				}
			}
		}

		if len(visibleNews) == 0 {
			b.WriteString("No accessible news articles found for this product.\n")
		} else {
			b.WriteString(fmt.Sprintf("%d recent article(s) found:\n\n", len(visibleNews)))

			limit := 5
			if len(visibleNews) < limit {
				limit = len(visibleNews)
			}
			for i := 0; i < limit; i++ {
				n := visibleNews[i]
				excerpt := n.Content
				if len(excerpt) > 150 {
					excerpt = excerpt[:150] + "…"
				}
				b.WriteString(fmt.Sprintf("- **%s** — %s\n", n.Title, excerpt))
			}
			b.WriteString("\n")
		}
	} else {
		b.WriteString("## News & Market Context\n\n")
		b.WriteString("No news articles have been collected yet.\n\n")
	}

	// Footer
	b.WriteString("---\n")
	b.WriteString(fmt.Sprintf("*Generated by Pricelyt · %d price snapshots · %d news articles · %s*\n",
		len(prices), len(news), time.Now().Format("Jan 2, 2006 3:04 PM")))

	return b.String()
}

// --- Math helpers ---

func mean(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range vals {
		sum += v
	}
	return sum / float64(len(vals))
}

func min(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	m := vals[0]
	for _, v := range vals[1:] {
		if v < m {
			m = v
		}
	}
	return m
}

func max(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	m := vals[0]
	for _, v := range vals[1:] {
		if v > m {
			m = v
		}
	}
	return m
}

func stddev(vals []float64) float64 {
	if len(vals) < 2 {
		return 0
	}
	avg := mean(vals)
	sumSq := 0.0
	for _, v := range vals {
		diff := v - avg
		sumSq += diff * diff
	}
	return math.Sqrt(sumSq / float64(len(vals)))
}

func linearSlope(vals []float64) float64 {
	n := float64(len(vals))
	if n < 2 {
		return 0
	}
	sumX, sumY, sumXY, sumX2 := 0.0, 0.0, 0.0, 0.0
	for i, y := range vals {
		x := float64(i)
		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
	}
	denom := n*sumX2 - sumX*sumX
	if denom == 0 {
		return 0
	}
	return (n*sumXY - sumX*sumY) / denom
}

func humanizeDuration(d time.Duration) string {
	if d < time.Minute {
		return "less than a minute"
	}
	if d < time.Hour {
		mins := int(d.Minutes())
		if mins == 1 {
			return "1 minute"
		}
		return fmt.Sprintf("%d minutes", mins)
	}
	if d < 24*time.Hour {
		hours := int(d.Hours())
		if hours == 1 {
			return "1 hour"
		}
		return fmt.Sprintf("%d hours", hours)
	}
	days := int(d.Hours() / 24)
	if days == 1 {
		return "1 day"
	}
	return fmt.Sprintf("%d days", days)
}

// --- Profile methods ---

func (s *Service) GetUserStats(ctx context.Context, userID string) (*UserStats, error) {
	return s.repo.GetUserStats(ctx, userID)
}

func (s *Service) GetUserTrackers(ctx context.Context, userID string) ([]Tracker, error) {
	return s.repo.GetUserTrackers(ctx, userID)
}
