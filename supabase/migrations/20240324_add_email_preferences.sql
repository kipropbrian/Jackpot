-- Migration: Add email preferences for user notifications
-- Created: 2024-03-24

-- Add email preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications ON profiles(email_notifications);

-- Add comment for documentation
COMMENT ON COLUMN profiles.email_notifications IS 'Global email notification preference for user';

-- Update existing users to have email notifications enabled by default
UPDATE profiles 
SET email_notifications = true
WHERE email_notifications IS NULL; 