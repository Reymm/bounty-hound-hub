-- Add unique constraint to username field in profiles table to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles(username) WHERE username IS NOT NULL;