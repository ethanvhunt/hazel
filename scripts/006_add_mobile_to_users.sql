-- Add mobile number column to users table for India mobile numbers
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(15);

-- Create index for mobile lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
