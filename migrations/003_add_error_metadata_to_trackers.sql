ALTER TABLE trackers
ADD COLUMN error_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_error_code TEXT,
ADD COLUMN last_error_message TEXT,
ADD COLUMN last_error_at TIMESTAMP;
