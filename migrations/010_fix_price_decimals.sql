-- 010: Change price columns from INTEGER to DECIMAL(12,2)
-- Enables cents-level price precision for all price_log columns
ALTER TABLE price_logs
    ALTER COLUMN market_price TYPE DECIMAL(12,2),
    ALTER COLUMN min_price TYPE DECIMAL(12,2),
    ALTER COLUMN max_price TYPE DECIMAL(12,2),
    ALTER COLUMN median_price TYPE DECIMAL(12,2);
