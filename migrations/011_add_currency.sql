-- 011: Add currency column to price_logs
-- Allows future multi-currency support (IDR, EUR, etc.)
ALTER TABLE price_logs ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
