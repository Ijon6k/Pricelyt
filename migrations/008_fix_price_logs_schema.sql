-- Make this rename idempotent: only rename if the old column still exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'price_logs' AND column_name = 'avg_price'
  ) THEN
    ALTER TABLE price_logs RENAME COLUMN avg_price TO market_price;
  END IF;
END $$;

ALTER TABLE price_logs
ADD COLUMN IF NOT EXISTS median_price INTEGER;
