import {
  SkeletonCard,
  SkeletonButton,
  SkeletonBadge,
} from "@/components/ui/skeleton";

export default function SimulationDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <SkeletonCard className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Title skeleton */}
            <div className="h-7 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            {/* Subtitle skeleton */}
            <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          </div>
          <div className="flex space-x-3 ml-6">
            <SkeletonButton className="w-24" />
            <SkeletonButton className="w-20" />
          </div>
        </div>
      </SkeletonCard>

      {/* Simulation Information Skeleton */}
      <SkeletonCard>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-6">
            {/* Status row */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <SkeletonBadge />
            </div>

            {/* Combination Type row */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>

            {/* Effective Combinations row */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>

            {/* Total Cost row */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
            </div>

            {/* Created At row */}
            <div className="flex justify-between items-center py-4">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </SkeletonCard>

      {/* Results Skeleton */}
      <SkeletonCard className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Prize breakdown skeleton */}
          <div className="mt-6">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SkeletonCard>
    </div>
  );
}
