ALTER TABLE trackers
ADD COLUMN scrape_interval_minutes INTEGER NOT NULL DEFAULT 1440,
ADD COLUMN last_scraped_at TIMESTAMP;
