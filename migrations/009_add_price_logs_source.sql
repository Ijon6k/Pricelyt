-- 009: Add source column to price_logs
-- Tracks which marketplace the price data came from
ALTER TABLE price_logs ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'unknown';
CREATE INDEX IF NOT EXISTS idx_price_logs_source ON price_logs(source);
