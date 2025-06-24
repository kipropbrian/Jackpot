"use client";

import { useAuth } from "@/lib/hooks/use-auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // React Query will handle the auth state automatically
  // No need to manually initialize - it happens when components mount
  useAuth();

  return <>{children}</>;
}
