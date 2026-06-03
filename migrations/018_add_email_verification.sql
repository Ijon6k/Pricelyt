-- Migration 018: Add email verification to users
-- Users must verify their email before they can log in.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;

-- Index for token lookup during verification
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Record this migration
INSERT INTO schema_migrations (version, applied_at)
VALUES ('018', NOW())
ON CONFLICT (version) DO NOTHING;
