BEGIN;

-- rename avg_price → market_price
ALTER TABLE price_logs
RENAME COLUMN avg_price TO market_price;

-- add median_price (boleh NULL dulu)
ALTER TABLE price_logs
ADD COLUMN median_price INTEGER;

COMMIT;
