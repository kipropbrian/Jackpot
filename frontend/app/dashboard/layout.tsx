"use client";

import { ReactNode } from "react";
import AuthGuard from "@/components/auth/auth-guard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { signOut } from "@/lib/supabase/auth-helpers";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";

// Load notification bell on the client only, after main bundle
const NotificationBell = dynamic(
  () => import("@/components/notifications/notification-bell"),
  {
    ssr: false,
    loading: () => (
      <div className="h-6 w-6 animate-pulse bg-gray-200 rounded-full" />
    ),
  }
);

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Base navigation items available to all users
  const baseNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      current: pathname === "/dashboard",
    },
    {
      name: "Bets",
      href: "/dashboard/simulations",
      current: pathname.startsWith("/dashboard/simulations"),
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      current: pathname === "/dashboard/profile",
    },
  ];

  // Admin navigation items for superadmins
  const adminNavigation = [
    {
      name: "Jackpots",
      href: "/dashboard/jackpots",
      current: pathname.startsWith("/dashboard/jackpots"),
    },
    {
      name: "Admin Panel",
      href: "/admin",
      current: pathname.startsWith("/admin"),
    },
  ];

  // Combine navigation based on user role
  const navigation =
    profile?.role === "superadmin"
      ? [...baseNavigation, ...adminNavigation]
      : baseNavigation;

  const handleLogout = async () => {
    try {
      await signOut();
      // Clear all cached data on logout
      queryClient.clear();
      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link
                    href="/dashboard"
                    className="text-xl font-bold text-blue-600"
                  >
                    Gambling Awareness
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        item.current
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        item.name === "Admin Panel"
                          ? "text-red-600 hover:text-red-700"
                          : ""
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {/* Notification Bell */}
                <NotificationBell />

                <div className="ml-3 relative">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <span className="text-gray-700">
                        {profile?.full_name || user?.email}
                      </span>
                      {profile?.role === "superadmin" && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="px-2 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  item.name === "Admin Panel" ? "text-red-600" : ""
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-red-600 hover:bg-gray-50 hover:border-gray-300 text-base font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
