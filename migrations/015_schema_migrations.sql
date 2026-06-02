-- 015: Create schema_migrations table for version tracking
-- Enables idempotent migration tracking and CI/CD pipeline awareness
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mark all existing migrations as applied (they're already in DB)
INSERT INTO schema_migrations (version) VALUES
    ('001_create_trackers'),
    ('002_add_view_count'),
    ('003_add_error_metadata_to_trackers'),
    ('004_add_scrape_interval'),
    ('005_add_processing_started_at'),
    ('006_create_price_logs'),
    ('007_create_news_logs'),
    ('008_fix_price_logs_schema'),
    ('009_add_price_logs_source'),
    ('010_fix_price_decimals'),
    ('011_add_currency'),
    ('012_create_users'),
    ('013_add_user_id_to_trackers'),
    ('014_add_updated_at_trigger')
ON CONFLICT (version) DO NOTHING;
