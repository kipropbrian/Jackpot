-- Script to promote a user to superadmin
-- Replace 'your-email@example.com' with the actual email address of the user you want to promote

-- First, let's see what users exist
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Promote a specific user to superadmin (replace the email below)
UPDATE public.profiles 
SET role = 'superadmin', is_active = true 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com' -- REPLACE THIS WITH YOUR EMAIL
);

-- Verify the update worked
SELECT 
  u.email,
  p.role,
  p.is_active,
  p.full_name
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE p.role = 'superadmin'; 