# Pricelyt

Track and compare product prices across marketplaces. Monitor price changes over time, set watchlists, and find the best deals.

## Stack

- **API:** Go
- **Scraper:** Python
- **Frontend:** Next.js
- **Database:** PostgreSQL
- **Reverse proxy:** Nginx

Everything runs in Docker containers.

## Quick Start

```bash
cp .env.example .env
# edit .env — at minimum set JWT_SECRET and INTERNAL_API_KEY
docker compose up -d
```

App available at **http://localhost:4444**.

## Features

- Track product prices across multiple sources (Amazon, eBay)
- Price history with charts and trend analysis
- Watchlists and favorites
- User accounts with JWT auth
- Shareable tracker links
- PWA support for mobile
- AI-generated deal summaries

---

*Built with [Hermes Agent](https://github.com/nousresearch/hermes-agent) — an autonomous coding agent that handled planning, implementation, code review, and deployment across 11 phases.*
