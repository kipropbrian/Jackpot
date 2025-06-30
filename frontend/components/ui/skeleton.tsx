import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  const style = {
    width,
    height,
  };

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        ...style,
        animation:
          "pulse 2s ease-in-out infinite, shimmer 2s ease-in-out infinite",
      }}
    />
  );
}

export function SkeletonText({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-4 bg-gray-200 rounded ${className}`} />;
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-10 bg-gray-200 rounded-md ${className}`} />;
}

export function SkeletonBadge({ className = "" }: { className?: string }) {
  return (
    <Skeleton className={`h-6 w-20 bg-gray-200 rounded-full ${className}`} />
  );
}

export function SkeletonCard({ children, className = "" }: SkeletonProps) {
  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>
  );
}

// Add shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Dashboard-specific skeleton components
export function DashboardSkeleton() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            {/* Top 3 Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Total Simulations Card */}
              <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <Skeleton className="h-6 w-6 bg-blue-300" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <Skeleton className="h-4 w-28 mb-2" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </div>
                </div>
                <div className="bg-blue-100 px-4 py-4 sm:px-6">
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>

              {/* Current Jackpot Card */}
              <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <Skeleton className="h-6 w-6 bg-green-300" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <Skeleton className="h-4 w-36 mb-2" />
                      <Skeleton className="h-8 w-44" />
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 px-4 py-4 sm:px-6">
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>

              {/* Winning Probability Card */}
              <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <Skeleton className="h-6 w-6 bg-purple-300" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                  </div>
                </div>
                <div className="bg-purple-100 px-4 py-4 sm:px-6">
                  <Skeleton className="h-4 w-38" />
                </div>
              </div>
            </div>

            {/* Results Analysis Section */}
            <div className="mt-8">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: "w-40", value: "w-20" },
                      { label: "w-32", value: "w-16" },
                      { label: "w-28", value: "w-20" },
                      { label: "w-36", value: "w-32" },
                      { label: "w-32", value: "w-36" },
                      { label: "w-24", value: "w-28" },
                    ].map((sizes, i) => (
                      <div
                        key={i}
                        className="bg-white overflow-hidden shadow rounded-lg"
                      >
                        <div className="px-4 py-5 sm:p-6">
                          <Skeleton className={`h-4 ${sizes.label} mb-2`} />
                          <Skeleton className={`h-8 ${sizes.value}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="mt-8">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { title: "w-40", desc: "w-52" },
                  { title: "w-36", desc: "w-48" },
                ].map((sizes, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <Skeleton className="h-10 w-10 rounded" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Skeleton className={`h-4 ${sizes.title} mb-2`} />
                      <Skeleton className={`h-3 ${sizes.desc}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
