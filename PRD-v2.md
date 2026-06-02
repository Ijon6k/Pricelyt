# Pricelyt 2.0 — Product Requirements Document

> **Status:** Active | **Last updated:** 2026-06-02
> **Target:** Pricelyt as a quiet, powerful price intelligence tool you actually want to use.

---

## What Pricelyt Is

Pricelyt tells you when to buy.

You tell it what you're interested in. It watches prices across marketplaces, tracks news, and surfaces what matters — without notifications screaming at you, without dark patterns, without treating you like a conversion funnel.

It's a tool for people who research before they spend.

---

## The Feeling We're Going For

When you open Pricelyt, it should feel like opening a well-made notebook. Nothing shouts. Nothing blinks. Everything is exactly where you expect it to be.

Think: Apple Notes, not Salesforce. Google Search, not an enterprise dashboard. Linear, not Jira.

The tool recedes. The information stays.

---

## Design System: North Star

### Typography is the interface

Headlines breathe. Body text is comfortable at 16px. There's more whitespace than you think you need. The content carries the page — not cards, not shadows, not decorations.

### Color as signal, not decoration

One accent color. Used sparingly. Most of the interface is neutral — zinc grays, white, near-black. When color appears, it *means* something: a price dropped, a deal is exceptional, something needs attention.

### Motion that respects attention

Transitions are fast and subtle. No bounce. No spring animations on every hover. When something moves, it moves with purpose — a chart animating in, a card appearing after you create it, a number updating.

### Dark mode is first-class, not an afterthought

System-aware by default. True black isn't the goal — deep charcoal is easier on the eyes. Both modes get equal design attention.

### Copy that sounds like a person wrote it

No "leverage," no "seamless experience," no "empower your journey." Short sentences. Clear words. When there's nothing to say, we say nothing. Error messages explain what happened and what to do next. Empty states feel considered, not abandoned.

### What we avoid

- Card-that-looks-like-glass with blur backdrop
- Gradient buttons with glow effects
- "AI-powered ✨" badges on everything
- Purple-to-blue gradient everything
- Emoji as section headers
- Unnecessary loading spinners (skeleton screens instead)
- Three-word startup slogans
- Dashboard widgets that exist just to fill space

---

## Core Features

### 1. Product Tracking

**What it does:** You search for a product. You add it. Pricelyt watches it.

**How it works under the hood:**
- Worker picks up new trackers within 5 seconds
- Scrapes Amazon first (primary marketplace), falls back to eBay
- Aggregates prices from search results + detail pages
- Filters outliers, normalizes currencies
- Saves a price snapshot with market price, min, max, median, sample count
- Also scrapes news articles related to the product

**What the user sees:**
- A clean tracker card with: product name, latest price, 24h change indicator, status
- Click through to detail: full price chart (area chart, not line — area feels calmer), price history table, news sidebar
- Status indicators that are clear but not alarming:
  - "Watching" — tracker created, waiting for first scrape
  - "Collecting" — worker is actively scraping
  - Tracked — data is fresh, everything is normal
  - "Stale" — data is older than the configured interval
  - Error — something went wrong (with a way to retry)

### 2. Search

**What it does:** Find products you're tracking, or discover new ones to track.

**How it works:**
- Search-as-you-type, 500ms debounce
- Searches across your existing trackers (ILIKE, sorted by relevance)
- If nothing found, offers to create a new tracker for that keyword
- Match indicators: exact match, partial match, or no match

**Search results UX:**
- Clean list, not cards — search results are scannable
- Already-tracked items show current price inline
- "Track this product" action is a single click, no modal, no form

### 3. Price Intelligence

**Price chart:**
- Time-series area chart showing price movement
- Y-axis adapts to the data range (doesn't start at $0 unless it makes sense)
- Hover tooltip shows exact price, date, and sample count
- Date range selector: 7 days, 30 days, 90 days, all time
- The chart tells a story — you can see price trends at a glance

**Deal scoring (Phase 3):**
- A simple score: how good is the current price compared to historical data?
- Not a number out of 100. Something more human:
  - "Great deal — 34% below average"
  - "Fair price — close to the 3-month average"
  - "Above typical — wait if you can"
- Based on percentile within the historical price distribution

**Price prediction (Phase 3):**
- Simple linear regression over recent data points
- Directional indicator only: trending down →, flat →, trending up ↗
- No fake precision — "Likely to drop slightly in the next 2 weeks" not "Predicted price: $247.31"
- Under the hood: lightweight statistical model, not an LLM call

### 4. Multi-Marketplace

**Phase 1 (current + improvements):**
- Amazon (primary)
- eBay (fallback)

**Phase 2 target:**
- Both marketplaces scraped independently
- Results shown side by side
- Source badge on each price point
- "Amazon: $347 — eBay: $329" at a glance

### 5. News Monitoring

**What it does:** Finds recent news articles about the product.

**How it works:**
- Queries Bing News with `{keyword} news {currentYear}`
- Filters out social media, video platforms, and marketplace listings
- Deduplicates by URL
- Extracts article content (first paragraphs, not full page scrape)
- Skips articles behind paywalls or WAF

**What the user sees:**
- News sidebar on tracker detail page
- Article title, source, date, and a brief excerpt
- Click opens the article in a new tab
- No "trending" or "recommended for you" noise — just what's relevant

### 6. User Accounts (Phase 3)

**What changes:**
- Trackers are scoped to a user
- Each user has their own dashboard
- Simple email + password registration
- JWT-based authentication
- No email verification for v1 (keep friction low)
- No social login (keep the surface area small)

**Account page:**
- Email, password change
- API key generation (for programmatic access)
- Data export (CSV of all price history)

### 7. Watchlists (Phase 3)

**What it does:** Group trackers into named collections.

- "PC Build 2026" — CPU, GPU, RAM, motherboard
- "Kitchen upgrades" — mixer, pan set, knife block
- Watchlists appear as sections on the dashboard
- Drag to reorder (but the default sort is "recently updated")

### 8. Price Alerts (Phase 3)

**What it does:** Tell you when a price drops below a target.

- Set a target price per tracker
- When the market price drops below target: send one notification
- Delivery: email (v1), webhook (v2)
- Alert is sent once, then snoozed until price goes back above target + drops again
- No push notifications (PWA can do this later, but it's not a priority)

### 9. Data Export

**CSV export:**
- Per tracker: all price history with timestamps
- Per watchlist: combined export
- Download from the tracker detail page
- Clean CSV — no weird formatting, no merged cells, just data

### 10. Sharing

**Tracker sharing:**
- Generate a public link for any tracker
- Public page shows price chart + history (read-only)
- No auth required to view
- Can be revoked anytime
- Useful for sharing with friends, family, or in forums

---

## Architecture (Target State)

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx :4444                          │
│            Reverse proxy + static assets                 │
└───────┬─────────────────────────────────┬───────────────┘
        │                                 │
┌───────▼────────┐              ┌─────────▼──────────┐
│  Next.js :3000 │              │   Go API :8080      │
│  SSR frontend  │──────────────▶   REST + JWT auth   │
│  PWA support   │ server       │                     │
│                │ actions      │  Endpoints:         │
│  Pages:        │              │  - CRUD trackers    │
│  - Dashboard   │              │  - Search           │
│  - Detail      │              │  - Auth (register,  │
│  - Search      │              │    login, refresh)  │
│  - Account     │              │  - Watchlist CRUD   │
│  - Shared view │              │  - Export CSV       │
└────────────────┘              │  - Alerts CRUD      │
                                │  - Health           │
                                └─────────┬───────────┘
                                          │ SQL
                                ┌─────────▼───────────┐
                                │  PostgreSQL :5432    │
                                │                      │
                                │  Tables:             │
                                │  - users             │
                                │  - trackers          │
                                │  - watchlists        │
                                │  - watchlist_items   │
                                │  - price_logs        │
                                │  - news_logs         │
                                │  - price_alerts      │
                                │  - shared_links      │
                                └─────────┬────────────┘
                                          │ claim + write
                                ┌─────────▼────────────┐
                                │  Python Worker Pool   │
                                │                       │
                                │  - Amazon scraper     │
                                │  - eBay scraper       │
                                │  - News scraper       │
                                │  - Alert checker      │
                                │                       │
                                │  Playwright browsers  │
                                └───────────────────────┘
```

---

## UI Page-by-Page

### Dashboard (/)

The first thing you see. Not a lot of things — the right things.

**Layout:**
- Top: Logo, search bar (prominent, centered), theme toggle (subtle, bottom corner)
- Below search: your trackers
  - Grouped by watchlist (if any)
  - Or just a list, sorted by recently updated
- Empty state: "Nothing tracked yet. Search for a product to get started."

**Tracker card design:**
- Not a card. A row. Like an email in Gmail or a task in Linear.
- Left to right: product name, current price, change indicator (small arrow + %), status dot
- Subtle background on hover
- Click anywhere → detail page
- The "card" is defined by whitespace, not borders or shadows

### Detail Page (/trackers/[id])

The product's story.

**Layout (desktop):**
```
┌────────────────────────────────────────────┐
│ ← Back    Product Name        [⋮ actions]  │
│                                            │
│   $347.00                                  │
│   Amazon · 24 samples · 2h ago             │
│                                            │
│ ┌──────────────────────────┐ ┌───────────┐ │
│ │                          │ │ News      │ │
│ │     Price Chart          │ │           │ │
│ │     (area chart)         │ │ Title 1   │ │
│ │                          │ │ excerpt…  │ │
│ │                          │ │           │ │
│ │                          │ │ Title 2   │ │
│ │                          │ │ excerpt…  │ │
│ └──────────────────────────┘ │           │ │
│                              │ Title 3   │ │
│ 7d · 30d · 90d · All        │ excerpt…  │ │
│                              └───────────┘ │
│  Price History                              │
│  ┌──────────────────────────────────────┐   │
│  │ Date       · Price  · Source · Count │   │
│  │ Jun 1      · $347   · Amazon · 24   │   │
│  │ May 31     · $352   · Amazon · 18   │   │
│  │ May 30     · $349   · eBay   · 12   │   │
│  └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

**Stale data state:**
- If data is old: subtle amber indicator, "Last checked 3 days ago"
- Not alarming. Just informative.

**Error state:**
- If tracker errored out: "We couldn't get pricing for this product."
- A retry button. No drama, no red banners.

### Search Page (/search?q=...)

Utility-first. No decoration.

**Layout:**
- Search bar at top (pre-filled with query)
- Results list:
  - Already tracked: product name + current price + "View →"
  - Not tracked: product name + "Track this product →"
- No results: "No products found matching '...' — want to track it anyway?"
- The whole page loads fast. No skeleton screens if it takes < 200ms.

### Account (/account)

Bare minimum, but good:

- Email (read-only after registration)
- Change password
- API key section (generate, copy, revoke)
- Data export (all trackers as CSV)
- Delete account

No profile pictures. No bio. No social links. It's a tool account, not a social profile.

### Shared View (/s/[shareId])

Public, read-only:

- Product name
- Price chart (same as detail page but no actions)
- Price history table
- "Tracked by Pricelyt" subtle footer with link back
- No auth, no cookies, no tracking
- Loads fast, works without JavaScript (the chart degrades to a table)

---

## Feature Roadmap

### Fase 0: Make it work (current)
Critical bug fixes. The app should not crash, should not give wrong HTTP codes, should not lose data.

### Fase 1: Make it solid
Foundation improvements. Validation, error handling, graceful shutdown, health checks.

### Fase 2: Make the data right
Schema upgrade. Decimal prices, currency column, proper timestamps, source tracking.

### Fase 3: Make it useful
User accounts, watchlists, deal scoring, price prediction, alerts.

### Fase 4: Make it beautiful
PWA, mobile optimization, dark mode refinement, motion design, better empty/error states.

### Fase 5: Make it production
Logging, monitoring, CI/CD, migration versioning, E2E tests.

---

## Feature Ideas (Beyond the Current Roadmap)

These are not committed. They're directions worth exploring once the core is solid.

**Price comparison view** — select two trackers and see their price histories overlaid on the same chart. Useful for comparing alternatives.

**Price calendar** — see price history as a calendar heatmap. Some products have predictable seasonal patterns.

**Browser extension** — right-click on any product page → "Track with Pricelyt." Reduces the friction of typing product names.

**Telegram bot integration** — receive price alerts and status updates via Telegram. Lower friction than email for some users.

**Screenshot archive** — capture a screenshot of the product listing when scraping. Visual history alongside price history. (Storage-heavy — needs thought.)

**Price guarantee checker** — some credit cards offer price protection. Track a purchase date + price, Pricelyt watches for drops within the guarantee window.

**Competitor price monitoring** — business-oriented: track your competitors' product pricing. Multi-URL tracking with comparison view.

**Open-source self-host license** — keep it MIT for self-hosted, with a clear path to a hosted version later if needed.

---

## What Pricelyt Is Not

- Not a shopping comparison engine (no affiliate links, no "buy now" buttons)
- Not a deal aggregator (no "hot deals," no voting, no community)
- Not a portfolio tracker (no purchase history, no "my collection")
- Not a social platform (no comments, no sharing feeds, no follower counts)
- Not a general-purpose scraper (no arbitrary URL input, no custom selectors)

It does one thing: watches prices and tells you when they change. Everything else is scope creep.

---

## Constraints

- **Server:** Single machine, 3.7GB RAM, 2-core i3, ~38GB free disk
- **Budget:** $0 for infrastructure. Everything must run on existing hardware.
- **Stack:** Go, Python, PostgreSQL, Next.js — no new languages or databases
- **Deployment:** Docker Compose behind nginx. Single-node. No Kubernetes.
- **Scale target:** 1–10 users, ~100 trackers per user, ~1000 price points per tracker
- **Scraping ethics:** Rate-limited, respectful delays, no aggressive parallel scraping

---

## Success Looks Like

A person opens Pricelyt on their phone while standing in a store. They check if the price is right. They get an answer in under 3 seconds. They close the tab and make their decision.

No engagement metrics. No retention funnels. No "time on page."

Just: did it help someone make a better buying decision? If yes, it works.

---

*This PRD is a living document. It guides decisions, not constrains them. When the product teaches us something new, the PRD changes.*
