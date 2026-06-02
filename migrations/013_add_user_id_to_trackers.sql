-- 013: Add user_id + user_name to trackers
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE trackers ADD COLUMN IF NOT EXISTS user_name TEXT;
CREATE INDEX IF NOT EXISTS idx_trackers_user_id ON trackers(user_id);
