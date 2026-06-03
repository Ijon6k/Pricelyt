-- Migration 018: Add username to users table
-- Supports display names beyond just email

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username) WHERE username IS NOT NULL;
