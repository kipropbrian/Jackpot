"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminService } from "@/lib/api/services/admin-service";
import SimulationResults from "@/components/simulation/SimulationResults";

export default function AdminSimulationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Use admin service to fetch simulation (bypasses user restrictions)
  const {
    data: simulation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-simulation", params.id],
    queryFn: () => adminService.getSimulationDetails(params.id),
    staleTime: 5 * 60 * 1000,
  });

  // Format status for display with appropriate color
  const getStatusBadge = (status: string) => {
    let color = "";
    switch (status) {
      case "pending":
        color = "bg-yellow-100 text-yellow-800";
        break;
      case "running":
        color = "bg-blue-100 text-blue-800";
        break;
      case "completed":
        color = "bg-green-100 text-green-800";
        break;
      case "failed":
        color = "bg-red-100 text-red-800";
        break;
      default:
        color = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-red-500">
          Error loading simulation: {(error as Error).message}
        </div>
        <div className="mt-4">
          <Link
            href="/admin/simulations"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to simulations
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-gray-500">Simulation not found</div>
        <div className="mt-4">
          <Link
            href="/admin/simulations"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to simulations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg leading-6 font-medium text-gray-900">
                {simulation.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Admin view - Specification-based simulation
              </p>
            </div>
            <Link
              href="/admin/simulations"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Admin Access</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                You are viewing this simulation with admin privileges. This
                simulation belongs to:{" "}
                <strong>
                  {simulation.user_email ||
                    simulation.user_name ||
                    "Unknown User"}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results - MOVED TO THE TOP */}
      {simulation?.results && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Simulation Results
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Analysis results for this simulation
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5">
            <SimulationResults simulation={simulation} />
          </div>
        </div>
      )}

      {/* Admin Status Messages */}
      {simulation?.status === "completed" && !simulation?.results && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Results Missing
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  This simulation is marked as completed but analysis results
                  are not available. This might indicate an issue with the
                  analysis process.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Information - MOVED TO THE BOTTOM */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Simulation Information
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details and parameters of this specification-based simulation
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {getStatusBadge(simulation.status)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">User</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {simulation.user_email ||
                  simulation.user_name ||
                  "Unknown User"}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Combination Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {simulation.combination_type}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Total Combinations
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {simulation.effective_combinations?.toLocaleString() || 0}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Cost</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                KSh {simulation.total_cost?.toLocaleString() || 0}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(simulation.created_at).toLocaleDateString()}
              </dd>
            </div>
            {simulation.completed_at && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Completed</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(simulation.completed_at).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
