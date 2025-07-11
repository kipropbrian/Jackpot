import { supabase } from "./client";
import { User, Session } from "@supabase/supabase-js";

/**
 * Get the current user session
 */
export const getSession = async (): Promise<Session | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }
  return data.session;
};

/**
 * Get the current user
 */
export const getUser = async (): Promise<User | null> => {
  // Get user from session to avoid extra API call
  const session = await getSession();
  return session?.user || null;
};

/**
 * Get user profile including role - uses RPC to bypass RLS recursion
 */
export const getUserProfile = async (
  user?: User | null
): Promise<{
  role: string;
  full_name: string;
  is_active: boolean;
} | null> => {
  if (!user) return null;

  // Use RPC function to get user profile to avoid RLS recursion
  const { data, error } = await supabase.rpc("get_user_profile", {
    user_id: user.id,
  });

  if (error) {
    console.error("Error getting user profile:", error.message);
    return null;
  }

  // The RPC function returns an array, so we need to get the first item
  return data && data.length > 0 ? data[0] : null;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: { full_name?: string }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

/**
 * Update user profile metadata
 */
export const updateUserProfile = async (userData: { full_name?: string }) => {
  const { data, error } = await supabase.auth.updateUser({
    data: userData,
  });

  if (error) {
    throw error;
  }

  return data.user;
};
