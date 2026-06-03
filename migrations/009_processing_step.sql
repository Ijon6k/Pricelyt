-- 009: Add processing_step and rescrape_count columns for verbose tracking
-- Allows the frontend to display what the scraper is currently doing

ALTER TABLE trackers
ADD COLUMN IF NOT EXISTS processing_step VARCHAR(50) DEFAULT NULL;

ALTER TABLE trackers
ADD COLUMN IF NOT EXISTS rescrape_count INTEGER NOT NULL DEFAULT 0;

-- processing_step values:
--   AMAZON_1, AMAZON_2  — Amazon scrape attempts
--   EBAY                — eBay fallback
--   SAVING              — Saving results to DB
--   SUMMARY             — Generating AI summary
--   DONE                — Finished (set to NULL on READY)

COMMENT ON COLUMN trackers.processing_step IS 'Current processing step: AMAZON_1, AMAZON_2, EBAY, SAVING, SUMMARY';
COMMENT ON COLUMN trackers.rescrape_count IS 'Number of completed scrapes for this tracker';
