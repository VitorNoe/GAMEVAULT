-- ============================================
-- MIGRATION 002: Add Ban Fields
-- ============================================
-- Adds user-ban columns to the users table.
-- Safe to re-run: each column is added only if missing.
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_banned'
    ) THEN
        ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'banned_at'
    ) THEN
        ALTER TABLE users ADD COLUMN banned_at TIMESTAMP;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'ban_reason'
    ) THEN
        ALTER TABLE users ADD COLUMN ban_reason TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'banned_by'
    ) THEN
        ALTER TABLE users ADD COLUMN banned_by INTEGER REFERENCES users(id);
    END IF;
END $$;
