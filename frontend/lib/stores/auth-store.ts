import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { signInWithEmail, signUpWithEmail, signOut, getUser, getSession } from '../supabase/auth-helpers';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { full_name?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const [user, session] = await Promise.all([getUser(), getSession()]);
      set({ user, session, loading: false });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, error: (error as Error).message });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await signInWithEmail(email, password);
      set({ user: data.user, session: data.session, loading: false });
    } catch (error) {
      console.error('Sign in error:', error);
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  register: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      const data = await signUpWithEmail(email, password, { full_name: fullName });
      set({ user: data.user, session: data.session, loading: false });
    } catch (error) {
      console.error('Registration error:', error);
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut();
      set({ user: null, session: null, loading: false });
    } catch (error) {
      console.error('Logout error:', error);
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  updateProfile: async (data) => {
    // This will be implemented when we have the profile update functionality
    set({ loading: true, error: null });
    try {
      // TODO: Implement profile update
      set({ loading: false });
    } catch (error) {
      console.error('Profile update error:', error);
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
}));
