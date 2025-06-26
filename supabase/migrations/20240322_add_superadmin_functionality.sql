-- Migration: Add superadmin functionality
-- Date: 2024-03-22
-- Description: Adds role-based access control and superadmin capabilities

-- Add role and additional fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add check constraint for valid roles (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_roles' 
    AND table_name = 'profiles' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT valid_roles CHECK (role IN ('user', 'superadmin'));
  END IF;
END $$;

-- Create indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

-- Update existing users to have 'user' role and active status
UPDATE public.profiles SET role = 'user', is_active = true WHERE role IS NULL;

-- Function to get user profile safely (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE(role TEXT, full_name TEXT, is_active BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.role, p.full_name, p.is_active
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$;

-- Function to check if user is superadmin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(user_role = 'superadmin', false);
END;
$$;

-- Create superadmin RLS policies using the safe function
DROP POLICY IF EXISTS "Superadmins can read all profiles" ON public.profiles;
CREATE POLICY "Superadmins can read all profiles" ON public.profiles 
  FOR SELECT USING (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Superadmins can update all profiles" ON public.profiles;
CREATE POLICY "Superadmins can update all profiles" ON public.profiles 
  FOR UPDATE USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to view all simulations
DROP POLICY IF EXISTS "Superadmins can read all simulations" ON public.simulations;
CREATE POLICY "Superadmins can read all simulations" ON public.simulations 
  FOR SELECT USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to view all bet combinations
DROP POLICY IF EXISTS "Superadmins can read all bet combinations" ON public.bet_combinations;
CREATE POLICY "Superadmins can read all bet combinations" ON public.bet_combinations 
  FOR SELECT USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to view all simulation results
DROP POLICY IF EXISTS "Superadmins can read all simulation results" ON public.simulation_results;
CREATE POLICY "Superadmins can read all simulation results" ON public.simulation_results 
  FOR SELECT USING (public.is_superadmin(auth.uid()));

-- Function to update last_login timestamp
CREATE OR REPLACE FUNCTION public.update_last_login() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = NOW() 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login on auth (check if trigger exists first)
DROP TRIGGER IF EXISTS on_auth_login ON auth.sessions;
CREATE TRIGGER on_auth_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_last_login();

-- Create a view for admin user statistics
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'user') as regular_users,
  COUNT(*) FILTER (WHERE role = 'superadmin') as superadmins,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as active_last_30_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30_days
FROM public.profiles;

-- Create a view for admin simulation statistics
CREATE OR REPLACE VIEW public.admin_simulation_stats AS
SELECT 
  COUNT(*) as total_simulations,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_simulations,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_simulations,
  COUNT(*) FILTER (WHERE status = 'running') as running_simulations,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as simulations_last_30_days,
  COALESCE(SUM(total_cost), 0) as total_simulation_cost,
  COALESCE(AVG(total_cost), 0) as avg_simulation_cost
FROM public.simulations;

-- Grant permissions for superadmins to access these views
GRANT SELECT ON public.admin_user_stats TO authenticated;
GRANT SELECT ON public.admin_simulation_stats TO authenticated;

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated;

-- Add RLS policies for the views (only superadmins can access)
ALTER VIEW public.admin_user_stats SET (security_invoker = true);
ALTER VIEW public.admin_simulation_stats SET (security_invoker = true);

-- Comments
COMMENT ON COLUMN public.profiles.role IS 'User role: user or superadmin';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN public.profiles.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN public.profiles.metadata IS 'Additional user metadata as JSON'; 