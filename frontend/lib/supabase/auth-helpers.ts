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
 * Get user profile including role - tries to use metadata first, falls back to RPC
 */
export const getUserProfile = async (
  user?: User | null
): Promise<{
  role: string;
  full_name: string;
  is_active: boolean;
} | null> => {
  if (!user) return null;

  // Try to get profile info from user metadata first
  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};

  // If we have all the required info in metadata, use that
  if (
    appMetadata.role &&
    metadata.full_name !== undefined &&
    appMetadata.is_active !== undefined
  ) {
    return {
      role: appMetadata.role,
      full_name: metadata.full_name || "",
      is_active: appMetadata.is_active,
    };
  }

  // Fall back to RPC if metadata is incomplete
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
