import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const cookieStore = cookies();
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        cookieOptions: {
          name: 'sb-auth-token',
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      global: {
        headers: {
          'x-client-info': `nextjs/${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development'}`,
        },
      },
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
            return true;
          } catch (error) {
            return false;
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
            return true;
          } catch (error) {
            return false;
          }
        },
      },
    }
  );
};
