-- 014: Add auto-update trigger for trackers.updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trackers_updated_at ON trackers;
CREATE TRIGGER trigger_trackers_updated_at
    BEFORE UPDATE ON trackers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
