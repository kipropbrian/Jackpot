import { useQuery } from "@tanstack/react-query";
import { getUser, getSession, getUserProfile } from "../supabase/auth-helpers";
import { User, Session } from "@supabase/supabase-js";

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
      const [user, session] = await Promise.all([getUser(), getSession()]);

      // Only fetch profile if we have a user, and pass the user to avoid duplicate getUser call
      const profile = user ? await getUserProfile(user) : null;

      return { user, session, profile };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
