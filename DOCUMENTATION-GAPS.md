# Pricelyt — Documentation Gaps & Missing Documentation

> Functions, edge cases, magic numbers, and config that are NOT documented anywhere (not in PRD.md, not in README.md).

---

## 1. Undocumented Functions

### 1.1 Go API — `internal/db/postgres.go`
- **Function**: `NewPostgres(dsn string) (*sqlx.DB, error)`
- **Not documented**: Connection pool settings (MaxOpenConns=10, MaxIdleConns=5, ConnMaxLifetime=30min)
- **Not documented**: Uses `sqlx.Connect` (not `sql.Open` + `Ping`) — performs implicit health check on init
- **Not documented**: Assumes `lib/pq` driver is imported via blank identifier (`_ "github.com/lib/pq"`)

### 1.2 Go API — `internal/http/middleware/admin.go`
- **Function**: `AdminOnly(next http.HandlerFunc) http.HandlerFunc`
- **Not documented**: Fallback to `"change-me"` if `ADMIN_KEY` env var is empty
- **Not documented**: Uses plain string comparison (not constant-time comparison)
- **Not documented**: No logging on auth failure
- **Not documented**: Only protects DELETE endpoint — create and read are public

### 1.3 Go API — `internal/http/middleware/ratelimiter.go`
- **Function**: `RateLimiterConfig(next http.Handler) http.Handler`
- **Not documented**: 50 requests/second limit (magic number)
- **Not documented**: Behind nginx, per-IP limiting is effectively global (all requests share nginx IP)
- **Not documented**: Uses `tollbooth` v7 — returns custom JSON error
- **Not documented**: Applied to ALL endpoints uniformly — `/api/health`, CRUD, and search all share the same bucket

### 1.4 Go API — `internal/health/handler.go`
- **Function**: `Handler(db *sqlx.DB) http.HandlerFunc`
- **Not documented**: Returns `200 OK` even when DB is down (status="degraded", database="down")
- **Not documented**: No timeout on `db.Ping()`

### 1.5 Go API — `internal/tracker/repository.go`
- **`FindAll()`**: Selects only 5 columns (id, keyword, status, created_at, view_count) — **does not return error_count, last_error_code, last_error_message, last_error_at**. This means the homepage list never shows error info.
- **`AddTracker()`**: Returns `RETURNING id, keyword, status, created_at, view_count` — does NOT return `scrape_interval_minutes` or other defaults.
- **`Search()`**: `LIMIT 20`, ordered by `length(keyword) ASC, created_at DESC` — undocumented priority logic (shorter names first)
- **`IncrementViewCount()`**: Uses raw SQL `UPDATE ... SET view_count = view_count + 1` — no locking, race condition on concurrent views
- **`FindPriceLogs()`**: Returns price data with **zero cents precision** (INTEGER) — undocumented assumption that prices are USD whole dollars
- **`FindNewsLogs()`**: `LIMIT 50` — undocumented cap

### 1.6 Go API — `internal/tracker/service.go`
- **`GetTrackerByID()`**: Returns `*Tracker` (no logs, no detail). **This function exists but is never called.** The router only registers `GetTrackerByID` handler, which calls `GetTrackerDetailByID` on the service.
- **`GetTrackerDetailByID()`**: Swallows errors from `FindPriceLogs` and `FindNewsLogs` (uses `_`). If logs fail, tracker is returned with empty log arrays silently.
- **`SearchTracker()`**: ILIKE partial match means `?q=rtx` matches "RTX 4070" — not documented
- **`AddTracker()`**: Returns basic validation error "keyword cannot be empty" — no trimming, no length limit, no sanitization

### 1.7 Python Worker — `worker.py`
- **`pick_tracker()`**: Uses `autocommit=False`, explicit transaction with `ROLLBACK` on error — if `SQL_MARK_PROCESSING` succeeds but `commit()` fails, tracker stays PENDING and can be picked again
- **`insert_price_logs()`**: No batch insert — one row per tracker
- **`insert_news_logs()`**: Individual INSERT per article — no batch, no transaction rollback on partial failure
- **Main loop**: Sleeps 5s when idle (`SLEEP_IDLE_SECONDS=5`) — undocumented constant
- **`Max_AMAZON_RETRIES = 2`**: undocumented constant

### 1.8 Python Worker — `scraper_price.py`
- **`_normalize_text()`**: Strips all non-alphanumeric, lowercases
- **`_parse_price_raw()`**: Complex heuristic for comma/dot decimal localization — undocumented edge cases
- **`_filter_outliers()`**: Removes prices outside [0.1×median, 5×median] — undocumented multiplier constants
- **`_scrape_detail_page()`**: Aborts image/media/font resources — undocumented
- **`scrape_price()`**: 3 pages (`PAGES_TO_SCRAPE=3`), 5 detail pages max (`MAX_DETAIL_PAGE_VISITS=5`), product identifier must contain ALL alphanumeric terms from keyword (e.g. "RTX 4070" becomes ["rtx", "4070"] — only the numeric term "4070" is kept as identifier)
- **CAPTCHA detection**: Looks for `"api-services-support@amazon.com"` and `"Enter the characters"` — undocumented heuristics
- **Page timeout**: 45s on search pages, 15s on detail pages — undocumented
- **Sleep**: Random 2.0–3.0s between pages, 2.0–4.0s between detail pages
- **Cookie injection**: `lc-main=en_US`, `i18n-prefs=USD` — undocumented

### 1.9 Python Worker — `scraper_ebay.py`
- **`_parse_ebay_price()`**: Range handling ("to" split), same IDR normalization as Amazon
- **`PAGES_TO_SCRAPE = 2`**: undocumented
- **Negative keywords**: 10-word filter list
- **Price threshold**: > $20 to include
- **Timeout**: 30s
- **Sleep**: 3s hard sleep
- **Selector**: `li.s-item, .s-item__wrapper` — undocumented

### 1.10 Python Worker — `scraper_news.py`
- **`IGNORED_DOMAINS`**: 9-domain ignore list
- **`MAX_NEWS_TOTAL = 10`**: undocumented
- **`ARTICLE_TIMEOUT_MS = 20000`**: 20s per article — undocumented
- **Query building**: `{keyword} news {currentYear}` — undocumented
- **Selector fallback**: Two-tier — `div.news-card > a.title` then `a.title`
- **Bing filter**: `qdr=y` (past year) — undocumented
- **WAF detection**: 5 trigger phrases — undocumented
- **Content extraction**: 8 paragraphs max, 800 char fallback, 60 char minimum filter

### 1.11 Python Worker — `agent_profiles.py`
- 7 predefined browser profiles — undocumented. Profile selection is random.

### 1.12 Python Worker — `browser_factory.py`
- Playwright launch args: `--disable-blink-features=AutomationControlled`, `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-infobars`, etc.
- Stealth: `navigator.webdriver` → `undefined`, `navigator.platform` → per-profile
- Extra HTTP headers: `Accept-Language: en-US`, `Accept: ...`, `Referer: https://www.google.com/`
- **Bug**: Commented-out WebGL vendor line — `f"--use-gl={agent['vendor']}"` — agent profile has `"vendor"` field only for Chrome, Firefox has empty string

### 1.13 Python Worker — `queries.py`
- All SQL strings are undocumented. `SQL_PICK_ELIGIBLE` uses string concatenation for interval (`|| ' minutes'::INTERVAL`) — SQL injection safe (integer source) but no comment

### 1.14 Python Worker — `logger.py`
- Custom logger wrapper `get_logger()` — **unused**. Modules use `logging.getLogger("name")` directly instead.

### 1.15 `main.go`
- Loads `.env` from `../../.env` (relative to `cmd/server/`) — undocumented path assumption
- DB connection verification on startup: `SELECT inet_server_addr(), current_database()`
- Hardcoded default origins: `http://localhost:3000, http://localhost:4444`
- CORS headers include `X-Admin-Key` — undocumented

---

## 2. Undocumented Edge Cases

### 2.1 Keyword/Input Edge Cases
- Empty keyword → "keyword cannot be empty" error (500, not 400)
- Keyword > 255 chars → no validation, DB `TEXT` accepts anything
- Keyword with special SQL chars → `ILIKE` with `%` wrapping, no escaping issues (parameterized query)
- Duplicate keyword → PostgreSQL UNIQUE constraint violation → 500
- Keyword with no numeric chars → `identifiers` list will be empty → all search results pass the filter
- Unicode/emoji in keyword → `_normalize_text()` strips everything non-alphanumeric

### 2.2 Status Edge Cases
- Tracker stuck in PROCESSING → worker crashed mid-scrape → never claimed again (SQL_PICK_ELIGIBLE only selects PENDING or READY)
- Tracker in ERROR → **never retried** automatically — SQL_PICK_ELIGIBLE doesn't include ERROR status
- Tracker in READY → retried when `last_scraped_at + scrape_interval_minutes` elapses
- Multiple workers → `FOR UPDATE SKIP LOCKED` prevents double-claim

### 2.3 Price Edge Cases
- Zero prices → filtered out (`price > 50` on Amazon, `price > 20` on eBay)
- All prices filtered as outliers → `_filter_outliers` returns original if filtered list is empty
- Single price → `_filter_outliers` returns as-is (< 3 items bypasses filtering)
- Invalid/malformed price text → `_parse_price_raw` returns 0
- USD prices ≤ $50 (Amazon) or ≤ $20 (eBay) → silently excluded from price list
- Price exactly 50000 → NOT divided by IDR rate (threshold is `> 50000`)
- median_price nullable → if no median_price from old schema, frontend shows `null`

### 2.4 News Edge Cases
- Bing returns 0 results → empty news section
- All articles WAF-blocked → empty news section
- Article content fetch timeout → skipped silently (20s timeout)
- Duplicate URLs → deduplicated via `seen_urls` set
- Articles < 60 chars → filtered out

### 2.5 HTTP Edge Cases
- `DELETE /api/trackers/{id}` with wrong key → 403 "admin only"
- `GET /api/trackers/` (trailing slash) → route mismatch → 404 from Go default mux
- `GET /api/health` while DB is down → `200 {"status":"degraded","database":"down"}`
- Rate limit exceeded → `200 {"success":false,"error":"Too Many Requests."}` (200 not 429!)

---

## 3. Magic Numbers & Hardcoded Constants

| File | Constant | Value | Notes |
|------|----------|-------|-------|
| `ratelimiter.go` | Rate limit | 50 req/s | Global, not per-IP |
| `postgres.go` | MaxOpenConns | 10 | Connection pool |
| `postgres.go` | MaxIdleConns | 5 | Connection pool |
| `postgres.go` | ConnMaxLifetime | 30 minutes | Connection pool |
| `admin.go` | Fallback key | "change-me" | If ADMIN_KEY env empty |
| `scraper_price.py` | `IDR_TO_USD_RATE` | 16200 | Env override, fallback |
| `scraper_price.py` | `PAGES_TO_SCRAPE` | 3 | Amazon search result pages |
| `scraper_price.py` | `MAX_DETAIL_PAGE_VISITS` | 5 | Detail page fallback limit |
| `scraper_price.py` | IDR threshold | > 50000 | Prices above this assumed IDR |
| `scraper_price.py` | Price inclusion threshold | > 50 | Amazon: prices ≤ $50 excluded |
| `scraper_price.py` | Search page timeout | 45000 ms | 45 seconds |
| `scraper_price.py` | Detail page timeout | 15000 ms | 15 seconds |
| `scraper_price.py` | Outlier min | 0.1 × median | Lower bound |
| `scraper_price.py` | Outlier max | 5.0 × median | Upper bound |
| `scraper_price.py` | Sleep between pages | 2.0–3.0s | Random uniform |
| `scraper_price.py` | Sleep between detail | 2.0–4.0s | Random uniform |
| `scraper_ebay.py` | `PAGES_TO_SCRAPE` | 2 | eBay search pages |
| `scraper_ebay.py` | eBay price threshold | > 20 | Prices ≤ $20 excluded |
| `scraper_ebay.py` | Page timeout | 30000 ms | 30 seconds |
| `scraper_ebay.py` | Sleep | 3s | Hard sleep |
| `scraper_ebay.py` | `IDR_TO_USD_RATE` | 16200 | Same as price scraper |
| `scraper_news.py` | `MAX_NEWS_TOTAL` | 10 | Max articles saved |
| `scraper_news.py` | `ARTICLE_TIMEOUT_MS` | 20000 | 20s per article |
| `scraper_news.py` | Bing candidates | 15 | Max fetched from Bing |
| `scraper_news.py` | Content paragraphs | 8 | Max <p> elements |
| `scraper_news.py` | Content fallback | 800 chars | Truncation limit |
| `scraper_news.py` | Min content length | 60 chars | Filter below this |
| `worker.py` | `SLEEP_IDLE_SECONDS` | 5 | No work → sleep |
| `worker.py` | `MAX_AMAZON_RETRIES` | 2 | Retries before eBay |
| `worker.py` | Error message truncation | 255 chars | `str(message)[:255]` |
| `repository.go` | Search limit | 20 | Max search results |
| `repository.go` | News limit | 50 | Max news logs returned |
| `SearchBar.js` | Debounce | 500ms | Search-as-you-type |
| `AutoRefresh.js` | Poll interval | 5000ms | Default 5s |
| `PriceChart.js` | Min chart data | 2 points | Below this shows placeholder |
| `price_logs.sql` | Default scrape_interval | 1440 minutes | 24 hours |
| `jsconfig.json` | Path alias | `@/app/*` | Maps to `./app/*` |

---

## 4. Undocumented Configuration

### 4.1 Rate Limiter
- **Not documented**: 50 req/s global rate limit
- **Not documented**: Behind nginx, the rate limiter sees the proxy IP (all requests appear as one source)
- **Not documented**: Returns `200 OK` with error body when throttled (should be 429)

### 4.2 Admin Middleware
- **Not documented**: Fallback value `"change-me"` is a security risk in production
- **Not documented**: No constant-time comparison → timing attack possible
- **Not documented**: No audit logging on failed auth attempts

### 4.3 Database Connection
- **Not documented**: `sslmode=disable` hardcoded in docker-compose URL
- **Not documented**: Pool config is hardcoded in Go code, not env-var configurable
- **Not documented**: No connection retry logic — if DB is temporarily down, API exits with `log.Fatal`

### 4.4 CORS
- **Not documented**: Default origins include both `localhost:3000` and `localhost:4444`
- **Not documented**: `AllowCredentials: true` — but no cookies/auth currently used

### 4.5 Worker
- **Not documented**: Worker runs an infinite loop with no graceful shutdown handling
- **Not documented**: Worker gets a fresh DB connection per operation (no connection pooling)
- **Not documented**: `tmpfs` for /tmp and /var/tmp in Docker — Playwright browser cache
- **Not documented**: Error messages truncated to 255 chars

### 4.6 Frontend
- **Not documented**: `NEXT_PUBLIC_API_BASE` default `/api` assumes nginx reverse proxy
- **Not documented**: `API_BASE_INTERNAL` default `http://api:8080/api` assumes Docker Compose
- **Not documented**: `force-dynamic` on homepage — no ISR or static generation

---

## 5. No Tests

- **Go**: No test files anywhere (`*_test.go`)
- **Python**: No test files anywhere (`test_*` or `*_test.py`)
- **Frontend**: No test files anywhere (`*.test.js`, `*.spec.js`)
- **No e2e, no integration, no unit tests**

---

## 6. No CI/CD

- No `.github/`, no `Makefile`, no build scripts
- No linting step for Go or Python (only ESLint for frontend)
- No pre-commit hooks
