'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state when the app loads
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
