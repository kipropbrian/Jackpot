import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../supabase/auth-helpers";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";

interface AuthData {
  user: User | null;
  session: Session | null;
  profile: { role: string; full_name: string; is_active: boolean } | null;
}

export function useAuth() {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth"],
    queryFn: async (): Promise<AuthData> => {
      // Get session first - it contains the user object
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        return { user: null, session: null, profile: null };
      }

      if (!session?.user) {
        return { user: null, session: null, profile: null };
      }

      // Only fetch profile if needed - use session.user to avoid extra API call
      const profile = await getUserProfile(session.user);

      return {
        user: session.user,
        session,
        profile,
      };
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - profile data rarely changes
    gcTime: Infinity, // Keep in cache forever until explicitly invalidated
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1,
  });

  return {
    user: data?.user || null,
    session: data?.session || null,
    profile: data?.profile || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}
