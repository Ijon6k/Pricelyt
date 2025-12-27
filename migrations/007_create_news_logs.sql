CREATE TABLE news_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id UUID NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    source_url TEXT NOT NULL,

    content TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,

    scraped_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_news_logs_tracker_time
ON news_logs (tracker_id, scraped_at DESC);
