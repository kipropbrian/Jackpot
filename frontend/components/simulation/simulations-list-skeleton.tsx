import { SkeletonBadge } from "@/components/ui/skeleton";

export default function SimulationsListSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <div className="h-3 bg-gray-300 rounded w-12 animate-pulse"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-3 bg-gray-300 rounded w-24 animate-pulse"></div>
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-3 bg-gray-300 rounded w-12 animate-pulse"></div>
            </th>
            <th className="px-6 py-3 text-right">
              <div className="h-3 bg-gray-300 rounded w-16 ml-auto animate-pulse"></div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <SkeletonBadge />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
