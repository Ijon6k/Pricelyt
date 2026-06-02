# Pricelyt — Product Requirements Document

> Reconstructed from codebase analysis (original PRD was lost)
> Last updated: 2026-05-31

## Vision

**Search-driven price & news intelligence.**

User types a product name → system auto-monitors its market price from e-commerce sites + collects related news → displays historical price trends in one dashboard.

## Core Value Proposition

- **Zero-effort tracking**: Search once, system does the rest
- **Price intelligence**: Historical trends, not just snapshots
- **News context**: Related articles alongside price data
- **Multi-source**: Amazon primary → eBay fallback

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser    │────▶│  Nginx :4444 │────▶│ Next.js :3000│
│  (client)   │     │  (reverse    │     │  (frontend)  │
└─────────────┘     │   proxy)     │     └──────┬──────┘
                    └──────┬───────┘            │
                           │ SSR fetch          │ server action
                    ┌──────▼───────┐            │
                    │  Go API :8080 │◀───────────┘
                    └──────┬───────┘
                           │ SQL
                    ┌──────▼───────┐
                    │ PostgreSQL   │
                    │   :5432      │
                    └──────┬───────┘
                           │ claim + write
                    ┌──────▼───────┐
                    │ Python Worker│
                    │  (scraper)   │
                    └──────────────┘
```

### Services

| Service | Tech | Port | Role |
|---------|------|------|------|
| nginx | 1.27-alpine | 4444 (public) | Reverse proxy — /api → Go, / → Next.js |
| frontend | Next.js 16 (standalone) | 3000 | SSR + client UI |
| api | Go 1.25 | 8080 | REST API (trackers CRUD, search) |
| scraper | Python 3.11 + Playwright | — | Background worker (claim → scrape → write) |
| postgres | 16 | 5432 | Main database |
| migrate | postgres:16 (one-shot) | — | Runs SQL migrations on startup |

### Data Flow

1. **User searches** → debounced API call → if exists, show tracker card
2. **User creates tracker** → `POST /api/trackers` → row created with status `PENDING`
3. **Worker polls** → claims oldest `PENDING` tracker → sets `PROCESSING`
4. **Worker scrapes** → Amazon (3 pages, detail fallback) → saves price_logs
5. **Fallback** → if Amazon fails, try eBay
6. **News scrape** → Bing News for keyword → saves news_logs
7. **Worker marks** → `READY` (success) or `ERROR` (failure)
8. **Auto-refresh** → client polls every 5s while status is PENDING/PROCESSING

## Database Schema

### `trackers`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| keyword | TEXT | Search term |
| status | TEXT | PENDING, PROCESSING, READY, ERROR |
| scrape_interval | INTERVAL | Default 24h |
| view_count | INT | Incremented on detail view |
| error_count | INT | Consecutive scrape errors |
| last_error_code | TEXT | Last error identifier |
| last_error_message | TEXT | Human-readable error |
| processing_started_at | TIMESTAMPTZ | When worker claimed it |
| last_scraped_at | TIMESTAMPTZ | Last successful scrape |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `price_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tracker_id | UUID → trackers.id | FK, CASCADE |
| market_price | DECIMAL(12,2) | Mean price |
| min_price | DECIMAL(12,2) | Lowest found |
| max_price | DECIMAL(12,2) | Highest found |
| median_price | DECIMAL(12,2) | Median |
| sample_count | INT | Number of data points |
| scraped_at | TIMESTAMPTZ | |

### `news_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tracker_id | UUID → trackers.id | FK, CASCADE |
| title | TEXT | Article title |
| content | TEXT | Snippet |
| source_url | TEXT | Original URL |
| scraped_at | TIMESTAMPTZ | |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | — | DB connectivity check |
| GET | /api/trackers | — | List all + search with `?q=` |
| POST | /api/trackers | — | Create new tracker |
| GET | /api/trackers/{id} | — | Detail with price_logs + news_logs |
| DELETE | /api/trackers/{id} | Admin | Delete tracker (X-Admin-Key header) |

## Scraper Strategy

### Price Scraping (Amazon-first, eBay fallback)
1. Search Amazon for keyword (3 pages)
2. Filter results by product identifier match
3. Extract prices from listings
4. If < 5 prices, visit up to 5 detail pages
5. Filter outliers (±5x median)
6. Record: mean, median, min, max, sample count

### Currency Handling
- Prices > $50,000 assumed IDR → divided by `IDR_TO_USD_RATE` (default 16200)

### News Scraping
1. Bing News search for keyword
2. Extract top 10 results
3. Save title, snippet, URL

## Future Roadmap

### Short-term (MVP+)
- [ ] Alert system (email/notification when price drops below threshold)
- [ ] Price prediction (simple linear regression)
- [ ] Indonesian marketplace scraping (Tokopedia, Bukalakak, Shopee)

### Medium-term
- [ ] User accounts + watchlists
- [ ] API rate limiting per-user
- [ ] RSS feed import
- [ ] Browser extension for 1-click tracking

### Long-term
- [ ] ML-based price forecasting
- [ ] Deal score (compare price vs historical average)
- [ ] Multi-currency support
- [ ] Affiliate link integration (monetization)

## Design Principles

- **Calm, minimal UI** — no gradients, no glow, no neon
- **Data is the hero** — whitespace, typography, chart quality
- **Dark mode first** — neutral tones, zinc palette
- **Responsive** — mobile-first, works on all screen sizes
- **Loading states** — skeletons, spinners, auto-refresh feedback
