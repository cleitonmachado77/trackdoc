-- Migration: Add force password change functionality
-- Date: 2024-12-10
-- Description: Adding field to force password change on first login

-- Add field to track if user needs to change password on first login
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;

-- Add field to track if user has ever logged in
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_login_completed boolean DEFAULT false;

-- Create index for performance on password change queries
CREATE INDEX IF NOT EXISTS idx_profiles_force_password_change 
ON public.profiles USING btree (force_password_change) 
TABLESPACE pg_default
WHERE force_password_change = true;

-- Create index for first login tracking
CREATE INDEX IF NOT EXISTS idx_profiles_first_login 
ON public.profiles USING btree (first_login_completed) 
TABLESPACE pg_default
WHERE first_login_completed = false;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.force_password_change IS 'Forces user to change password on next login (set to true for new users created by admin)';
COMMENT ON COLUMN public.profiles.first_login_completed IS 'Tracks if user has completed their first login and password change';