-- Migration 016: Create shared_links table for tracker sharing
-- Each tracker can have at most one active share link.

CREATE TABLE IF NOT EXISTS shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id UUID NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One share link per tracker (upsert-friendly)
CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_links_tracker_id ON shared_links(tracker_id);

-- Fast lookup by token (already unique, but explicit index for clarity)
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_links(token);

-- Record this migration
INSERT INTO schema_migrations (version, applied_at)
VALUES ('016', NOW())
ON CONFLICT (version) DO NOTHING;
