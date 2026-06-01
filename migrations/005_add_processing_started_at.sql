ALTER TABLE trackers
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;
