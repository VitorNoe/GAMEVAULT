-- ============================================
-- MIGRATION 001: Add Authentication Fields
-- ============================================
-- This migration adds email verification and password reset
-- fields to the users table for existing databases.
-- If your database was created from the latest schema.sql,
-- these columns already exist and this migration is a no-op.
-- ============================================

-- Add email_verified column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Add email_verification_token column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verification_token'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
    END IF;
END $$;

-- Add password_reset_token column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_reset_token'
    ) THEN
        ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
    END IF;
END $$;

-- Add password_reset_expires column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_reset_expires'
    ) THEN
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
    END IF;
END $$;

-- Add last_login column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    END IF;
END $$;

-- Mark all existing users as email-verified (they registered before verification was required)
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 001: Authentication fields added successfully';
END $$;
