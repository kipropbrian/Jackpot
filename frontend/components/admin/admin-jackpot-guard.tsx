"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

interface AdminJackpotGuardProps {
  children: ReactNode;
}

export default function AdminJackpotGuard({
  children,
}: AdminJackpotGuardProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not logged in, redirect to login
        router.push("/auth/login");
        return;
      }

      // Check if user has superadmin role from profile data
      if (!profile || profile.role !== "superadmin") {
        // User is not a superadmin, redirect to dashboard
        router.push("/dashboard");
        return;
      }
    }
  }, [user, profile, loading, router]);

  // Show loading state while checking authentication
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user is superadmin based on profile data
  if (profile.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access jackpot information. Only
            admins can view jackpot details.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
