-- Script to add email verification fields to users table
-- This script can be run on both local and production databases

-- Add email verification code field (4-digit code)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationCode" character varying(4);

-- Add email verification code expiry timestamp
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationCodeExpiresAt" TIMESTAMP;

-- Add index on email verification code for faster lookups
CREATE INDEX IF NOT EXISTS "IDX_users_emailVerificationCode" ON "users" ("emailVerificationCode");

-- Add index on email verification code expiry for cleanup queries
CREATE INDEX IF NOT EXISTS "IDX_users_emailVerificationCodeExpiresAt" ON "users" ("emailVerificationCodeExpiresAt");

-- Update existing users to have isEmailVerified as false if not already set
UPDATE "users" SET "isEmailVerified" = false WHERE "isEmailVerified" IS NULL;

-- Make isEmailVerified column NOT NULL with default false
ALTER TABLE "users" ALTER COLUMN "isEmailVerified" SET DEFAULT false;
ALTER TABLE "users" ALTER COLUMN "isEmailVerified" SET NOT NULL;

-- Display success message
SELECT 'Email verification fields added successfully!' as message;