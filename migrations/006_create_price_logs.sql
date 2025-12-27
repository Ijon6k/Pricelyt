CREATE TABLE price_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id UUID NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,

    avg_price INTEGER NOT NULL,
    min_price INTEGER NOT NULL,
    max_price INTEGER NOT NULL,
    sample_count INTEGER NOT NULL,

    scraped_at TIMESTAMP NOT NULL DEFAULT NOW(),

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_logs_tracker_time
ON price_logs (tracker_id, scraped_at DESC);
