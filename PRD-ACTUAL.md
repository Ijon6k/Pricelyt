# Pricelyt — PRD (Actual Code, v2026-06)

> Generated from exhaustive source code reading — every Go handler, every SQL migration, every Python scraper, every frontend component.
> **This documents what the code *actually does*, not what was planned.**

---

## 1. Product Vision (Current Reality)

Pricelyt is a **search-driven price & news monitoring system** with no user accounts. A visitor types a product name → the system creates a tracker → a background worker scrapes Amazon (with eBay fallback) for prices and Bing News for related articles → results are displayed on a dashboard with a price chart and news feed.

**It is not multi-user, has no alerts, no notifications, no scheduling configuration, and no authentication on create/search endpoints.** It is a single-user intelligence board deployed behind nginx.

---

## 2. User Flow (Actual Implementation)

### 2.1 Homepage → Search
1. User lands on `/` (Server Component `page.js`, force-dynamic)
2. SSR fetches `GET /api/trackers` → renders cards grid or empty state
3. User types in `SearchBar` (Client Component)
4. **500ms debounce** → calls `GET /api/trackers?q=<keyword>` (search mode)
5. Dropdown shows existing trackers or "not tracked yet" + create button

### 2.2 Search Results Page
1. `router.push("/search?q=...")` → navigates to `/search/page.js`
2. SSR renders `SearchContent` (client component with `useSearchParams`)
3. Displays existing trackers as cards + "Track this product" CTA button
4. Clicking "Track" → calls `POST /api/trackers` → redirects to `/trackers/{new_id}`

### 2.3 Tracker Detail Page
1. Server Component at `/trackers/[id]/page.js`
2. SSR fetches `GET /api/trackers/{id}` → gets `TrackerDetail` (tracker + price_logs + news_logs)
3. Auto-refresh client component polls `router.refresh()` every 5s while status is PENDING/PROCESSING
4. Price chart (Recharts AreaChart) requires ≥2 data points
5. History table shows all price_logs in reverse chronological
6. News sidebar shows related articles
7. Delete button → confirmation → Server Action → `DELETE /api/trackers/{id}` with `X-Admin-Key`

### 2.4 Background Worker Flow
1. `worker.py` runs infinite loop: pick → process → sleep 5s if idle
2. `SQL_PICK_ELIGIBLE`: picks PENDING or READY trackers where `last_scraped_at <= NOW() - interval`
3. Claims with `FOR UPDATE SKIP LOCKED` + marks PROCESSING
4. Amazon scrape (up to 2 attempts, 3 pages + detail fallback)
5. If Amazon fails → eBay fallback (1 attempt, 2 pages)
6. News scrape (Bing News, max 10 articles + content fetch)
7. Marks READY (success) or ERROR (all sources failed)

---

## 3. Architecture

```
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│   Browser    │────▶│  Nginx :4444 │────▶│ Next.js :3000   │
│  (client)    │     │  (reverse    │     │  (SSR frontend) │
└──────────────┘     │   proxy)     │     └────────┬───────┘
                      └──────┬───────┘            │
                             │                    │ server action
                      ┌──────▼───────┐            │
                      │  Go API :8080 │◀───────────┘
                      │  (REST API)  │
                      └──────┬───────┘
                             │ SQL
                      ┌──────▼───────┐
                      │ PostgreSQL   │
                      │   :5432      │
                      └──────┬───────┘
                             │ claim + write
                      ┌──────▼──────────┐
                      │ Python Worker    │
                      │  (scraper, loop) │
                      └─────────────────┘
```

### 3.1 Services

| Service | Tech | Port | Role |
|---------|------|------|------|
| nginx | 1.27-alpine | 4444 (host:80) | Reverse proxy: `/api` → Go API, `/` → Next.js |
| frontend | Next.js 16.1 (standalone) | 3000 | SSR + client UI (React 19, App Router) |
| api | Go 1.25 + sqlx | 8080 | REST CRUD for trackers + search |
| scraper | Python 3.11 + Playwright 1.57 | — | Background loop: claim → scrape Amazon/eBay/news → write |
| postgres | 16 | 5432 | Main database (single instance) |
| migrate | postgres:16 (one-shot) | — | Runs all SQL migrations in sorted order, exits |

### 3.2 Internal Communication
- **Browser ↔ Nginx**: Port 4444, single origin (no CORS preflight in production)
- **Nginx → Frontend**: `proxy_pass http://frontend:3000`
- **Nginx → Go API**: `proxy_pass http://api:8080` (path `/api/...`)
- **Frontend → API (SSR)**: Direct Docker networking `http://api:8080/api`
- **Frontend → API (Client)**: Relative `/api/...` → nginx proxies it
- **API → Postgres**: `postgres://user:pass@postgres:5432/pricelyt_db?sslmode=disable`
- **Worker → Postgres**: Same DSN, `psycopg2` direct connection
- **Worker ↔ External**: HTTPS to amazon.com, ebay.com, bing.com via Playwright Chromium

---

## 4. API Endpoints

Base path: `/api` (stripped by nginx and Go router `StripPrefix`)

### 4.1 `GET /api/health`
- **Response (200)**: `{"status": "ok"|"degraded", "database": "connected"|"down"}`
- **Edge case**: DB ping failure → status=`degraded`, database=`down`

### 4.2 `GET /api/trackers`
- **Query params**: `?q=<keyword>` (optional)
- **Without q**: Returns full list `Tracker[]`
- **With q**: Returns `SearchResponse`
  ```json
  {
    "match_type": "NONE" | "EXACT" | "PARTIAL",
    "query": "keyword",
    "results": [Tracker]
  }
  ```
- **Search behavior**: `ILIKE` match, ordered by `length(keyword) ASC, created_at DESC`, `LIMIT 20`
- **Match type logic**: `NONE` if empty results, `EXACT` if any keyword matches case-insensitively, else `PARTIAL`

### 4.3 `POST /api/trackers`
- **Request**: `{"keyword": "string"}`
- **Response (201)**: Created `Tracker` with status=`PENDING`
- **Validation**: Keyword cannot be empty (returns 500 with "keyword cannot be empty")
- **DB constraint**: `keyword TEXT NOT NULL UNIQUE` — duplicate keyword returns 500

### 4.4 `GET /api/trackers/{id}`
- **Response (200)**: `TrackerDetail` — embeds `Tracker` + `price_logs[]` + `news_logs[]`
- **Side effect**: Increments `view_count`
- **Price logs**: Ordered by `scraped_at ASC`
- **News logs**: Ordered by `scraped_at DESC`, max 50

### 4.5 `DELETE /api/trackers/{id}`
- **Auth**: Requires `X-Admin-Key` header matching `ADMIN_KEY` env var (or fallback `"change-me"`)
- **Response (204)**: No Content on success
- **Errors**: 403 Forbidden (wrong key), 404 Not Found, 500 Internal
- **Cascade**: `ON DELETE CASCADE` removes associated price_logs and news_logs

---

## 5. Database Schema (Actual Columns from Migrations)

### 5.1 `trackers`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | `gen_random_uuid()` | PK |
| keyword | TEXT | — | NOT NULL, UNIQUE |
| status | TEXT | — | NOT NULL — PENDING/PROCESSING/READY/ERROR |
| created_at | TIMESTAMPTZ | `now()` | NOT NULL |
| updated_at | TIMESTAMPTZ | `now()` | NOT NULL — NOT tracked by app code |
| view_count | INTEGER | 0 | NOT NULL, mig002 |
| error_count | INTEGER | 0 | NOT NULL, mig003 |
| last_error_code | TEXT | NULL | mig003 |
| last_error_message | TEXT | NULL | mig003 |
| last_error_at | TIMESTAMP | NULL | mig003 |
| scrape_interval_minutes | INTEGER | 1440 | NOT NULL, mig004 — **not INTERVAL type** |
| last_scraped_at | TIMESTAMP | NULL | mig004 |
| processing_started_at | TIMESTAMP | NULL | mig005 |

**Indexes**: `idx_trackers_keyword (keyword)`, `idx_trackers_status (status)`

### 5.2 `price_logs`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | `gen_random_uuid()` | PK |
| tracker_id | UUID | — | FK → trackers(id) ON DELETE CASCADE, NOT NULL |
| market_price | INTEGER | — | NOT NULL — **renamed from `avg_price`** (mig008), **INTEGER not DECIMAL** |
| min_price | INTEGER | — | NOT NULL, **INTEGER not DECIMAL** |
| max_price | INTEGER | — | NOT NULL, **INTEGER not DECIMAL** |
| median_price | INTEGER | NULL | **Added mig008, nullable INTEGER not DECIMAL** |
| sample_count | INTEGER | — | NOT NULL |
| scraped_at | TIMESTAMP | `now()` | NOT NULL |
| created_at | TIMESTAMP | `now()` | NOT NULL |

**Index**: `idx_price_logs_tracker_time (tracker_id, scraped_at DESC)`

### 5.3 `news_logs`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | `gen_random_uuid()` | PK |
| tracker_id | UUID | — | FK → trackers(id) ON DELETE CASCADE, NOT NULL |
| title | TEXT | — | NOT NULL |
| source_url | TEXT | — | NOT NULL |
| content | TEXT | NULL | News article snippet |
| is_blocked | BOOLEAN | FALSE | NOT NULL — WAF detection flag (**unused as TRUE**) |
| scraped_at | TIMESTAMP | `now()` | NOT NULL |
| created_at | TIMESTAMP | `now()` | NOT NULL |

**Index**: `idx_news_logs_tracker_time (tracker_id, scraped_at DESC)`

---

## 6. Scraper Strategy (Actual)

### 6.1 Price Scraping — Amazon (Primary)
1. 3 search result pages (`https://www.amazon.com/s?k={keyword}&page={N}`)
2. Amazon locale cookies set: `lc-main=en_US`, `i18n-prefs=USD`
3. CAPTCHA/paywall detection: abort if page contains `"api-services-support@amazon.com"` or `"Enter the characters"`
4. Filter search results: only items whose title contains ALL alphanumeric-numeric keyword terms (e.g. "RTX 4070" → must have "rtx4070" normalized in title)
5. Price extraction from `".a-price-whole"`, `".a-price"`, `".a-offscreen"` selectors
6. Prices > $50 → added to list. Items without price → saved for detail fallback
7. **Detail fallback**: If < 5 prices found, visit up to 5 detail pages (`_scrape_detail_page`) with 6 price selectors, blocking images/media/fonts for speed
8. **Outlier filter**: `_filter_outliers(prices)` — removes any price outside [0.1×median, 5×median]. If filtered result empty, uses original.

### 6.2 Price Scraping — eBay (Fallback)
1. 2 search pages (`https://www.ebay.com/sch/i.html?_nkw={keyword}&LH_BIN=1&_pgn={N}`)
2. Negatve keyword filter: skips items with "broken", "parts only", "faulty", "defective", "box only", "read description", "for parts", "not working", "cooler only", "damaged"
3. Skip "shop on ebay" title items
4. Price threshold > $20
5. No detail page fallback, no outlier filtering

### 6.3 Currency Normalization
- `IDR_TO_USD_RATE = 16200` (env override)
- If any parsed price > 50,000 after digit extraction → assumed IDR → divided by rate
- **Critical**: All prices stored as `INTEGER` (whole dollars). No cents precision.

### 6.4 Price Parser (shared logic)
- Handles `"1,234.56"`, `"1.234,56"`, `"IDR1,565,657.50"` formats
- Range prices: takes the lower value (eBay "to" split)
- Strips all non-digit, non-comma, non-period characters before parsing

### 6.5 News Scraping — Bing News
1. Query: `"{keyword} news {currentYear}"` on `https://www.bing.com/news/search`
2. `qdr=y` filter for past year
3. Two selector strategies:
   - Primary: `div.news-card > a.title`
   - Fallback: `a.title` with >10 char innerText
4. Max 15 candidates fetched from Bing, then shuffled randomly
5. Domain filter: skips youtube.com, facebook.com, twitter.com, reddit.com, instagram.com, tiktok.com, amazon.com, ebay.com, pinterest.com
6. Article content: extracts first 8 `<p>` elements, or `document.body.innerText` truncated to 800 chars
7. WAF detection: if content contains "verify you are a human", "access denied", "security check", "captcha", or "cloudflare" → skips article
8. Content length filter: skips articles with < 60 chars content
9. **Max 10 articles saved** per scrape cycle
10. URL deduplication via `seen_urls` set

### 6.6 Worker Retry Logic
| Phase | Max attempts | Notes |
|-------|-------------|-------|
| Amazon scrape | 2 | 2–5s random sleep between attempts |
| eBay fallback | 1 | Only if Amazon returned None after 2 attempts |
| News scrape | 1 | Runs after price save regardless of source |
| DB operations | 1 | Exception → `mark_error(DB_ERROR)` |

### 6.7 Worker DB Queries

**Pick eligible (SQL_PICK_ELIGIBLE)**:
```sql
SELECT id, keyword FROM trackers
WHERE status = 'PENDING'
   OR (status = 'READY'
       AND (last_scraped_at IS NULL
            OR last_scraped_at <= NOW() - (scrape_interval_minutes || ' minutes')::INTERVAL))
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

**Mark READY**: Sets `last_scraped_at=NOW()`, clears error fields, resets `error_count=0`

**Mark ERROR**: Sets `error_count += 1`, saves error code/message/at, clears `processing_started_at`

---

## 7. Configuration

### 7.1 Environment Variables

| Variable | Required | Default | Services | Purpose |
|----------|----------|---------|----------|---------|
| `POSTGRES_USER` | No | `postgres` | postgres, migrate | DB username |
| `POSTGRES_PASSWORD` | No | `postgres` | postgres, migrate | DB password |
| `POSTGRES_DB` | No | `pricelyt_db` | postgres, migrate | DB name |
| `DATABASE_URL` | Yes (api, scraper) | — | api, scraper | Full DSN (api uses `?sslmode=disable`) |
| `APP_PORT` | No | `8080` | api | Go HTTP listen port |
| `ADMIN_KEY` | No | `change-me` | api, frontend | Admin auth for DELETE. Must match between services |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://localhost:4444` | api | Comma-separated allowed origins |
| `IDR_TO_USD_RATE` | No | `16200` | scraper | IDR→USD divisor for price normalization |
| `API_BASE_INTERNAL` | No | `http://api:8080/api` | frontend | SSR-side API base URL |
| `NEXT_PUBLIC_API_BASE` | No | `/api` | frontend | Client-side API base (relative) |
| `NODE_ENV` | No | `production` | frontend | Node environment |

### 7.2 Docker Compose
- Postgres: volume `pgdata`, healthcheck `pg_isready` every 5s
- Migrate: runs migrations, `depends_on: postgres: service_healthy`, `restart: "no"`
- API: depends on postgres + migrate completed, exposes 8080
- Scraper: depends on postgres + migrate completed, uses `tmpfs` for `/tmp` and `/var/tmp`
- Frontend: depends on api, exposes 3000
- Nginx: depends on frontend + api, publishes 4444 → container 80

### 7.3 Middleware
- **CORS** (Go, `rs/cors`): Allows all methods, all common headers, credentials
- **Rate Limiter** (Go, `tollbooth/v7`): 50 requests/second global (per-IP is effectively global behind nginx)
- **Admin Middleware** (Go, custom): Checks `X-Admin-Key` header against `ADMIN_KEY` env. Fallback `"change-me"` if env empty

### 7.4 Scraper Stealth Configuration
- 7 randomized browser profiles (Win Chrome 120/121/122, macOS Safari 17.2, macOS Chrome 120, Linux Chrome 120, Linux Firefox 115)
- Playwright launch args: `--disable-blink-features=AutomationControlled`, `--no-sandbox`, etc.
- `navigator.webdriver` overridden to `undefined` via `add_init_script`
- `navigator.platform` injected per profile
- HTTP headers: `Accept-Language: en-US`, `Referer: https://www.google.com/`
- Resources blocked: images, media, font (on detail pages and news fetch)

---

## 8. Frontend Structure

### 8.1 Pages
| Path | Component | Type | Data Source |
|------|-----------|------|-------------|
| `/` | `page.js` (HomePage) | Server | `fetchTrackers()` → `GET /api/trackers` |
| `/search?q=` | `search/page.js` (SearchPage) | Client (Suspense wrapper) | `searchTrackers()` → `GET /api/trackers?q=` |
| `/trackers/[id]` | `trackers/[id]/page.js` (TrackerDetailPage) | Server | `fetchTrackerDetail(id)` → `GET /api/trackers/{id}` |

### 8.2 Components
| Component | Type | File | Role |
|-----------|------|------|------|
| `SearchBar` | Client | `components/SearchBar.js` | Debounced search, dropdown, inline create |
| `TrackerCard` | Server-ok | `components/TrackerCard.js` | Card with status badge, price, change %, views |
| `TrackerDashboard` | Client | `components/TrackerDashboard.js` | Tab switching (chart/table), news sidebar |
| `PriceChart` | Client | `components/PriceChart.js` | Recharts AreaChart, custom tooltip |
| `AutoRefresh` | Client | `components/AutoRefresh.js` | Polls `router.refresh()` every 5s |
| `DeleteTrackerButton` | Client | `components/DeleteTrackerButton.js` | Confirm + Server Action |
| `ThemeToggle` | Client | `components/ThemeToggle.js` | Dark/light toggle, localStorage |
| `Logo` | Server | `components/Logo.js` | SVG icon + text |

### 8.3 Data Flow
- **SSR pages** (`/`, `/trackers/[id]`): Fetch in server component → render HTML → client hydrates
- **Client pages** (`/search`): Fetch in `useEffect`, render with loading spinner
- **Server Actions**: `deleteTrackerAction` → internal API call with ADMIN_KEY, `revalidatePath("/")`, `redirect("/")`
- **lib/api.js**: Dual base URL resolution — `NEXT_PUBLIC_API_BASE` for client, `API_BASE_INTERNAL` for server

### 8.4 UI Theme System
- CSS custom properties on `:root` and `[data-theme="dark"]`
- Colors: zinc palette, calm blue accent, no gradients
- Scrollbar customization via `.custom-scrollbar` class
- Font: system UI stack with antialiasing

---

## 9. Differences Between PRD.md and Actual Code

| PRD.md Says | Actual Code | Impact |
|-------------|-------------|--------|
| `scrape_interval` type **INTERVAL** | `scrape_interval_minutes INTEGER NOT NULL DEFAULT 1440` (migration 004) | PRD is wrong; DB stores minutes as integer, not PostgreSQL INTERVAL type |
| `market_price`, `min_price`, `max_price`, `median_price` type **DECIMAL(12,2)** | All are **INTEGER** (migrations 006, 008) | Prices stored as whole dollars, no cents precision. `median_price` is nullable INTEGER (not NOT NULL) |
| `updated_at` column on trackers listed | Not listed in PRD | Missing from PRD, but exists in migration 001 with `DEFAULT now()` — **app code never updates it** |
| `last_error_at` column on trackers | Not listed in PRD | Missing from PRD, exists in migration 003 |
| `created_at` on price_logs / news_logs | Not listed in PRD | Both tables have `created_at TIMESTAMP DEFAULT NOW()` |
| `is_blocked` on news_logs | Not listed in PRD | Exists in migration 007, BOOLEAN DEFAULT FALSE |
| PRD says "original PRD was lost" | PRD.md header says "Reconstructed from codebase analysis" | PRD.md is itself a reconstruction — our analysis is more thorough |
| PRD says API search returns `?q=` for list all | **Correct** — both list and search share `GET /api/trackers` | But PRD doesn't document `SearchResponse.match_type` field |
| PRD says scraper "Amazon primary → eBay fallback" | Amazon gets **2 retries**, eBay gets **1 attempt** | PRD underspecifies retry behavior |
| Frontend `ThemeToggle` has working click handler | `onClick={tab={toggle}}` is a **JSX syntax bug** | Theme toggle button will not work — compile/runtime JSX error |
| PRD says `view_count` incremented on detail view | **Correct** — `GetTrackerDetailByID` calls `IncrementViewCount` | Also called in `GetTrackerByID` (unused standalone function) |
| PRD doesn't mention rate limiter | **50 req/s global** via tollbooth | Not configurable, applied to all endpoints |
| PRD doesn't mention admin middleware | **X-Admin-Key** check, fallback `"change-me"` | DELETE-only protection |
| PRD doesn't mention health endpoint shape | `{"status":"ok|degraded","database":"connected|down"}` | Only DB ping check |
| PRD doesn't mention DB connection pool config | MaxOpenConns=10, MaxIdleConns=5, ConnMaxLifetime=30min | Not configurable without recompile |
| PRD says `price_logs` has `avg_price` | Renamed to `market_price` in migration 008 | Migration is idempotent |

---

## 10. Tech Stack (Actual)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Next.js | 16.1.1 |
| UI library | React | 19.2.3 |
| CSS | Tailwind CSS | 4.x |
| Charts | Recharts | 3.6.0 |
| Icons | lucide-react | 0.562.0 |
| API server | Go | 1.25.5 |
| DB driver | sqlx + lib/pq | sqlx 1.4.0, pq 1.10.9 |
| CORS | rs/cors | 1.11.1 |
| Rate limiter | tollbooth/v7 | 7.0.2 |
| Worker | Python | 3.11 |
| Browser automation | Playwright | 1.57.0 |
| DB driver (worker) | psycopg2-binary | 2.9.9 |
| Database | PostgreSQL | 16 |
| Runtime | Docker Compose | — |
| Reverse proxy | nginx | 1.27-alpine |
