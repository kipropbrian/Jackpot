import { useQuery } from "@tanstack/react-query";
import { getUser, getSession } from "../supabase/auth-helpers";
import { User, Session } from "@supabase/supabase-js";

interface AuthData {
  user: User | null;
  session: Session | null;
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
      return { user, session };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    user: data?.user || null,
    session: data?.session || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}
