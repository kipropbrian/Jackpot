"use client";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // React Query will handle the auth state automatically when components that need auth mount
  // No need to call useAuth here as it causes infinite re-renders
  return <>{children}</>;
}
