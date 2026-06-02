# Pricelyt — Codebase Gaps & Risks

> Issues found by reading every source code file — incomplete functionality, dangling references, bugs, and tech debt.

---

## 1. Bugs

### 1.1 CRITICAL: `ThemeToggle.js` JSX Syntax Error
**File**: `frontend/app/components/ThemeToggle.js`, line 34
```jsx
onClick={tab={toggle}}
```
**Problem**: This is a `SyntaxError` — JSX reads this as a prop assignment `tab={toggle}` combined with `onClick=`. React will throw. The button should be `onClick={toggle}`.
**Effect**: Theme toggle is completely broken. No way to switch themes from the UI.

### 1.2 MODERATE: `GetTrackerByID` Exists But Router Uses Different Handler
**File**: `backend/api-go/internal/tracker/handler.go`
- `GetTrackerByID` handler parses ID from URL path (`strings.Split(strings.Trim(r.URL.Path, "/"), "/")`)
- **But** the router in `router.go` registers: `apiMux.HandleFunc("GET /trackers/{id}", handler.GetTrackerByID)`
- Go 1.25's `http.ServeMux` with pattern matching means `r.PathValue("id")` should work, **but the handler ignores it** and manually splits the path
- **Potential bug**: If `StripPrefix` and route pattern interact, the path split might get wrong parts. The handler checks `len(parts) != 2` → if path has prefix left, split fails → 404

### 1.3 MODERATE: Rate Limiter Returns 200 Instead of 429
**File**: `backend/api-go/internal/http/middleware/ratelimiter.go`
- When rate limited, tollbooth sends the response through the `SetOnLimitReached` function
- The function writes `200 OK` (default status) with `{"success": false, "error": "Too Many Requests."}`
- **Should be**: HTTP 429 Too Many Requests

### 1.4 MODERATE: `median_price` Nullable Column Mismatch
**File**: `backend/api-go/internal/tracker/model.go` — `PriceLog.MedianPrice` has type `int` (no pointer)
**File**: `migrations/008_fix_price_logs_schema.sql` — `median_price INTEGER` (nullable, no NOT NULL)
- **Problem**: If the migration creates the column with NULL default, existing rows have NULL median_price. But Go struct expects `int` (not `*int`). `sqlx.Get`/`Select` will fail scanning NULL into a non-pointer int field.
- **This will crash the detail page** for any tracker that has price_log rows created before migration 008 was applied.

### 1.5 MODERATE: Tracker Stuck in PROCESSING Never Auto-Recovers
**File**: `backend/worker-python/scraper/queries.py` — `SQL_PICK_ELIGIBLE`
- Only selects status `PENDING` or `READY`
- If worker crashes while a tracker is `PROCESSING`, that tracker is **permanently stuck**
- No timeout mechanism, no heartbeat, no reaper

### 1.6 MODERATE: Tracker in ERROR Never Auto-Retry
- `SQL_PICK_ELIGIBLE` does NOT include `ERROR` status
- Once a tracker gets `ERROR`, it stays in error forever
- User has to delete and re-create

### 1.7 LOW: `last_error_at` Type Mismatch
**File**: `backend/api-go/internal/tracker/model.go` — `LastErrorAt *time.Time`
**File**: `migrations/003_add_error_metadata_to_trackers.sql` — `last_error_at TIMESTAMP`
- Go uses `*time.Time` (nullable pointer), which is correct for nullable TIMESTAMP
- But `processing_started_at` and `last_scraped_at` are not in the `Tracker` struct at all — they're never returned to the frontend

### 1.8 LOW: `news_logs.content` Might Leak Full Page Text
**File**: `backend/worker-python/scraper/scraper_news.py`
- Fallback is `document.body.innerText` truncated to 800 chars
- If there are fewer than 2 `<p>` elements, the entire page HTML body text is captured
- This could include nav bars, ads, footer text, etc.

### 1.9 LOW: No Graceful Shutdown for Worker
**File**: `backend/worker-python/scraper/worker.py`
- Main loop has `except KeyboardInterrupt: pass`
- No signal handling for SIGTERM (Docker sends SIGTERM)
- If container stops mid-scrape, Playwright browser stays open
- Tracker stays in PROCESSING (see 1.5)

---

## 2. Missing / Incomplete Functionality

### 2.1 No Updated At Management
**File**: `migrations/001_create_trackers.sql` — `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- No trigger, no application code updates `updated_at`
- The column always holds the creation timestamp
- Either remove the column or add auto-update logic

### 2.2 Frontend has `IsBlocked` in NewsLog Model But Never Uses It
**File**: `frontend/app/components/TrackerDashboard.js` — renders news from `tracker.news_logs`
- `NewsLog.IsBlocked` exists in the Go model (`json:"is_blocked"`) and in the DB
- Frontend renders ALL news items, even those with `is_blocked = true`
- **Worker sets `is_blocked: False` in all saved items** despite checking it — articles detected as blocked are simply skipped (not saved with `is_blocked=True`)

### 2.3 `content` Field in News Log Not Fully Utilized
- Content is stored and returned in API response
- Frontend uses `news.content` in a `line-clamp-2` paragraph
- If content is very long (800 chars), it's displayed raw — no summary logic

### 2.4 No Re-scrape Scheduling
- Worker re-picks READY trackers after `scrape_interval_minutes` (default 1440 = 24h)
- But there's no API to change scrape_interval (no PATCH/PUT endpoint)
- The only way to change it is direct SQL

### 2.5 No Concurrent Scrape Limit
- Worker picks one tracker at a time per container instance
- No concurrency control — runs single-file `while True` loop
- If there are 100 trackers, they're processed one-by-one

### 2.6 No Index on `trackers.status` for Worker Queries
- Migration 001 creates `idx_trackers_status`
- Worker query uses `WHERE status = 'PENDING' OR status = 'READY' AND ...` — PostgreSQL can use the index efficiently for equality, but the OR combined with `FOR UPDATE SKIP LOCKED` might not be optimal

### 2.7 `DeleteTrackerButton` Calls Server Action Without Hydration Wait
**File**: `frontend/app/components/DeleteTrackerButton.js`
- Server Action calls `redirect("/")` after delete
- If the action runs before client hydration completes, `startTransition` may not handle the redirect properly
- Should have `useFormStatus` or explicit error boundary

### 2.8 No Loading State for Server Components
- `page.js` (homepage) and `trackers/[id]/page.js` are Server Components
- If the API is slow, the user sees nothing until the entire SSR response is ready
- No streaming, no Suspense boundaries around data-fetching sections

---

## 3. Tech Debt

### 3.1 Hardcoded Path in main.go
**File**: `backend/api-go/cmd/server/main.go`, line 17
```go
_ = godotenv.Load("../../.env")
```
- Relative path assumes binary is always run from `backend/api-go/cmd/server/`
- Fails if you run from another directory (e.g. `go run ./cmd/server` from `api-go/`)
- No fallback or error checking (result is silently discarded with `_`)

### 3.2 Mixed Portuguese/English Comments
**Files**: `handler.go` — comments like `PERBAIKAN 1`, `PERBAIKAN 2`, `Wajib return`
- Mix of Indonesian and English makes maintenance harder
- Indicates rushed development

### 3.3 Unused Imports
**File**: `backend/worker-python/scraper/requirements.txt`
- `requests==2.31.0` and `beautifulsoup4==4.12.3` are listed but **never imported** in any Python file
- `python-dotenv==1.0.1` listed but never imported (the worker doesn't load .env)

### 3.4 Unused Logger Wrapper
**File**: `backend/worker-python/scraper/logger.py` — `get_logger()` function
- Defined but **never called** in any module
- All modules use `logging.getLogger("name")` directly
- The wrapper adds StreamHandler and formatter — this is already done in `main.py` via `logging.basicConfig`

### 3.5 Duplicate IDR_TO_USD_RATE Definition
**File**: `scraper_price.py` line 17 — `IDR_TO_USD_RATE = int(os.getenv("IDR_TO_USD_RATE", "16200"))`
**File**: `scraper_ebay.py` line 14 — `IDR_TO_USD_RATE = int(os.getenv("IDR_TO_USD_RATE", "16200"))`
- Defined twice with same logic — should be shared constant

### 3.6 Duplicate Cookie Injection
**File**: `scraper_price.py` — cookies set in both `scrape_price()` (line 142) and `_scrape_detail_page()` (line 79)
- Each function adds the same `lc-main` and `i18n-prefs` cookies independently
- Should be set once on the context

### 3.7 No Proper Error Handling in Price Scrapers
**File**: `scraper_price.py` — `scrape_price()` returns `None` on any exception
**File**: `scraper_ebay.py` — `scrape_ebay()` returns `None` on any exception
- All exceptions are caught with bare `except Exception: return None`
- No distinction between CAPTCHA, timeouts, network errors, or parse failures
- No logging in the catch blocks (exceptions are only logged in `worker.py`)

### 3.8 Inefficient News Content Fetching
**File**: `scraper_news.py`
- Each article visit reuses the same `page` object
- Between article visits, the page's DOM is replaced — but old resources might accumulate
- No `page.reload()` or memory management between articles
- Could lead to memory growth over time

### 3.9 Improper Error Handling: Bare `except:` in some places
**File**: `scraper_price.py` — `_scrape_detail_page()` uses `except:` (line 119)
**File**: `scraper_news.py` — `fetch_article_content()` uses `except:` (line 128)
- Bare `except:` catches `SystemExit` and `KeyboardInterrupt` too — should be `except Exception:`

### 3.10 No Input Validation for Views
- Each page view calls `IncrementViewCount` which hits the DB
- No rate limiting on views — a script could inflate view_count
- No cache layer

### 3.11 News Visit Uses the Same Tab for All Articles
- Reusing `page` for sequential article visits means:
  - If page crashes on one article, all remaining articles are affected
  - If one article redirects to a different domain, the state leaks
- No isolation between article fetches

---

## 4. Security Issues

### 4.1 MODERATE: `change-me` Default Admin Key
- If `ADMIN_KEY` env is not set, the hardcoded default is `"change-me"`
- Any deployment that doesn't set `ADMIN_KEY` has a known admin password

### 4.2 LOW: No Rate Limiting on POST /api/trackers
- Rate limiter applies globally (50 req/s), but POST is expensive (creates DB row + triggers worker)
- No per-endpoint rate limiting
- No request body size limiting

### 4.3 LOW: No CSRF Protection
- DELETE is protected only by `X-Admin-Key` header
- But Server Action can be called from any origin — browser CORS won't block it
- If ADMIN_KEY is leaked (via XSS or env exposure), delete is unprotected

### 4.4 LOW: User-Agent Spoofing Misrepresentation
- `browser_factory.py` sets `navigator.platform` and `navigator.webdriver` to circumvent detection
- This is against the terms of service of Amazon/eBay/Bing

---

## 5. Production Readiness Gaps

### 5.1 No Logging Aggregation
- Go: Uses `log.Println` — no structured logging, no log levels, no JSON output
- Python: Uses `logging.INFO` with basic format — no log levels configurable via env
- No correlation IDs between API request → DB write → worker scrape

### 5.2 No Metrics / Observability
- No Prometheus endpoints
- No health check for worker (only Go API has `/api/health`)
- No scrape latency tracking
- No error rate tracking per source

### 5.3 No Database Migration Versioning
- Migrations are numbered 001–008 but there's no version table
- All migrations are re-run every time the migrate container starts
- Migrations are idempotent (`IF NOT EXISTS`, `IF EXISTS`) so re-running is safe
- But there's no way to know which migrations have been applied

### 5.4 No Container Healthcheck
- API and frontend containers have no `healthcheck` in Docker Compose
- Nginx will route traffic to unhealthy containers until they crash

### 5.5 No Startup Order Guarantee for Frontend
- Frontend `depends_on: - api` only checks container started, not API ready
- First SSR request could hit the API before it's ready to serve
- No retry logic in `lib/api.js` — fetch failures throw immediately

### 5.6 No Environment-Specific Configuration
- No distinction between dev/staging/production
- `NODE_ENV=production` hardcoded in docker-compose for frontend
- Go API has no concept of environment — always runs in same mode

---

## 6. Things to Fix Before Continuing Development

### Priority High (Will cause crashes or data issues)
1. **Fix `ThemeToggle.js` JSX bug** (`tab={toggle}` → `toggle`)
2. **Fix `median_price` null scan** — change `PriceLog.MedianPrice` from `int` to `*int` in model.go
3. **Fix rate limiter status code** — return 429 instead of 200
4. **Add ERROR retry to worker** — include `ERROR` status in `SQL_PICK_ELIGIBLE` (with cooldown or max retry limit)
5. **Add PROCESSING timeout** — reaper query to reset stuck PROCESSING trackers back to PENDING after N minutes

### Priority Medium (Data quality or UX issues)
6. **Add PATCH endpoint** to update `scrape_interval_minutes`
7. **Return `scrape_interval_minutes` and `last_scraped_at` in Tracker model** — currently omitted from the Go struct
8. **Remove unused `requests` and `beautifulsoup4`** from requirements.txt
9. **Add graceful shutdown** for worker (SIGTERM → finish current task → close browser)
10. **Add input validation** — keyword length limit, trim whitespace, reject empty strings with 400

### Priority Low (Polish and correctness)
11. **Remove unused `updated_at` column** or add auto-update trigger
12. **Remove unused `logger.py` wrapper** function
13. **Clean up Indonesian comments to English**
14. **Add healthcheck to docker-compose** for API and frontend
15. **Add .env loading fallback** in main.go
