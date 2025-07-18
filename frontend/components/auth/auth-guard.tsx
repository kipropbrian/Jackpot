"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // If not authenticated and not on an auth page, redirect to login
      if (!session && !pathname.startsWith("/auth/")) {
        router.push("/auth/login");
      }

      // If authenticated and on an auth page, redirect to dashboard
      if (session && pathname.startsWith("/auth/")) {
        router.push("/dashboard");
      }
    }
  }, [session, loading, pathname, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If on a protected route and not authenticated, don't render children
  if (!session && !pathname.startsWith("/auth/")) {
    return null;
  }

  // If on an auth page and authenticated, don't render children
  if (session && pathname.startsWith("/auth/")) {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
}
