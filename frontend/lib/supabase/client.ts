import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in the browser
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Export a singleton instance for client-side usage
export const supabase = createClient();
