package tracker

import (
	"math"
	"testing"
	"time"
)

func TestMean(t *testing.T) {
	tests := []struct {
		name     string
		vals     []float64
		expected float64
	}{
		{"empty", []float64{}, 0},
		{"single", []float64{42.0}, 42.0},
		{"two values", []float64{10.0, 20.0}, 15.0},
		{"three values", []float64{1.0, 2.0, 3.0}, 2.0},
		{"with negatives", []float64{-5.0, 5.0}, 0.0},
		{"all same", []float64{7.0, 7.0, 7.0}, 7.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mean(tt.vals)
			if math.Abs(got-tt.expected) > 1e-9 {
				t.Errorf("mean(%v) = %v, want %v", tt.vals, got, tt.expected)
			}
		})
	}
}

func TestMin(t *testing.T) {
	tests := []struct {
		name     string
		vals     []float64
		expected float64
	}{
		{"empty", []float64{}, 0},
		{"single", []float64{5.0}, 5.0},
		{"ascending", []float64{1.0, 2.0, 3.0}, 1.0},
		{"descending", []float64{3.0, 2.0, 1.0}, 1.0},
		{"with negatives", []float64{-10.0, 0.0, 10.0}, -10.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := min(tt.vals)
			if got != tt.expected {
				t.Errorf("min(%v) = %v, want %v", tt.vals, got, tt.expected)
			}
		})
	}
}

func TestMax(t *testing.T) {
	tests := []struct {
		name     string
		vals     []float64
		expected float64
	}{
		{"empty", []float64{}, 0},
		{"single", []float64{5.0}, 5.0},
		{"ascending", []float64{1.0, 2.0, 3.0}, 3.0},
		{"descending", []float64{3.0, 2.0, 1.0}, 3.0},
		{"with negatives", []float64{-10.0, 0.0, 10.0}, 10.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := max(tt.vals)
			if got != tt.expected {
				t.Errorf("max(%v) = %v, want %v", tt.vals, got, tt.expected)
			}
		})
	}
}

func TestStddev(t *testing.T) {
	tests := []struct {
		name     string
		vals     []float64
		expected float64
	}{
		{"empty", []float64{}, 0},
		{"single", []float64{5.0}, 0},
		{"identical", []float64{5.0, 5.0, 5.0}, 0},
		{"simple", []float64{2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0}, 2.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := stddev(tt.vals)
			if math.Abs(got-tt.expected) > 1e-9 {
				t.Errorf("stddev(%v) = %v, want %v", tt.vals, got, tt.expected)
			}
		})
	}
}

func TestLinearSlope(t *testing.T) {
	tests := []struct {
		name     string
		vals     []float64
		expected float64
	}{
		{"empty", []float64{}, 0},
		{"single", []float64{5.0}, 0},
		{"flat", []float64{5.0, 5.0, 5.0}, 0},
		{"upward", []float64{1.0, 2.0, 3.0, 4.0, 5.0}, 1.0},
		{"downward", []float64{5.0, 4.0, 3.0, 2.0, 1.0}, -1.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := linearSlope(tt.vals)
			if math.Abs(got-tt.expected) > 1e-9 {
				t.Errorf("linearSlope(%v) = %v, want %v", tt.vals, got, tt.expected)
			}
		})
	}
}

func TestHumanizeDuration(t *testing.T) {
	tests := []struct {
		name     string
		dur      time.Duration
		expected string
	}{
		{"seconds", 30 * time.Second, "less than a minute"},
		{"one minute", 60 * time.Second, "1 minute"},
		{"minutes", 5 * time.Minute, "5 minutes"},
		{"one hour", 1 * time.Hour, "1 hour"},
		{"hours", 2 * time.Hour, "2 hours"},
		{"one day", 24 * time.Hour, "1 day"},
		{"days", 48 * time.Hour, "2 days"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := humanizeDuration(tt.dur)
			if got != tt.expected {
				t.Errorf("humanizeDuration(%v) = %q, want %q", tt.dur, got, tt.expected)
			}
		})
	}
}

func TestBuildSummary(t *testing.T) {
	tests := []struct {
		name        string
		keyword     string
		prices      []PriceLog
		news        []NewsLog
		wantErr     bool
		containsStr string
	}{
		{
			name:    "no prices",
			keyword: "RTX 4070",
			prices:  []PriceLog{},
			news:    []NewsLog{},
			containsStr: "No price data available",
		},
		{
			name:    "single price point",
			keyword: "RTX 4070",
			prices: []PriceLog{
				{MarketPrice: 599.99, Source: "amazon", ScrapedAt: testTime()},
			},
			news:        []NewsLog{},
			containsStr: "1 data points collected",
		},
		{
			name:    "three prices with downward trend",
			keyword: "RTX 4070",
			prices: []PriceLog{
				{MarketPrice: 650.00, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 620.00, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 599.99, Source: "amazon", ScrapedAt: testTime()},
			},
			news:        []NewsLog{},
			containsStr: "downward",
		},
		{
			name:    "three prices with upward trend",
			keyword: "MacBook Air",
			prices: []PriceLog{
				{MarketPrice: 999.00, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 1049.00, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 1099.00, Source: "amazon", ScrapedAt: testTime()},
			},
			news:        []NewsLog{},
			containsStr: "upward",
		},
		{
			name:    "with news",
			keyword: "PS5",
			prices: []PriceLog{
				{MarketPrice: 499.99, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 489.99, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 479.99, Source: "amazon", ScrapedAt: testTime()},
			},
			news: []NewsLog{
				{Title: "PS5 Price Drop", Content: "Sony announces price cut", IsBlocked: false},
			},
			containsStr: "News & Market Context",
		},
		{
			name:    "blocked news excluded",
			keyword: "PS5",
			prices: []PriceLog{
				{MarketPrice: 499.99, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 489.99, Source: "amazon", ScrapedAt: testTime()},
				{MarketPrice: 479.99, Source: "amazon", ScrapedAt: testTime()},
			},
			news: []NewsLog{
				{Title: "Blocked Article", Content: "Spam content", IsBlocked: true},
			},
			containsStr: "No accessible news",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			summary := buildSummary(tt.keyword, tt.prices, tt.news)
			if summary == "" {
				t.Error("buildSummary returned empty string")
			}
			if tt.containsStr != "" {
				if !contains(summary, tt.containsStr) {
					t.Errorf("buildSummary output missing %q.\nGot: %s", tt.containsStr, summary)
				}
			}
		})
	}
}

func testTime() time.Time {
	return time.Unix(1700000000, 0)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
