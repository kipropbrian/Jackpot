"use client";

import { useState } from "react";
import { useAllSimulations } from "@/lib/hooks/use-admin";
import {
  SimulationFilters,
  AdminSimulation,
  AdminPaginatedResponse,
} from "@/lib/api/services/admin-service";
import Link from "next/link";

export default function SimulationsManagement() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SimulationFilters>({});

  const {
    data: simulationsData,
    isLoading,
    error,
  } = useAllSimulations(page, 10, filters);

  // Provide fallback values to prevent type errors
  const safeSimulationsData: AdminPaginatedResponse<AdminSimulation> =
    (simulationsData as AdminPaginatedResponse<AdminSimulation>) || {
      data: [],
      total_count: 0,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === "all" ? undefined : status });
    setPage(1);
  };

  const handleUserFilter = (userEmail: string) => {
    setFilters({ ...filters, user_email: userEmail || undefined });
    setPage(1);
  };

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">
          <strong>Error loading simulations:</strong> {error.message}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Simulations Management
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage all user simulations across the system
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="text"
              placeholder="Filter by user email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleUserFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">
            Total Simulations
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {safeSimulationsData.total_count}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">This Page</div>
          <div className="text-2xl font-bold text-gray-900">
            {safeSimulationsData.data.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Current Page</div>
          <div className="text-2xl font-bold text-gray-900">
            {safeSimulationsData.page}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Pages</div>
          <div className="text-2xl font-bold text-gray-900">
            {safeSimulationsData.total_pages}
          </div>
        </div>
      </div>

      {/* Simulations Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {safeSimulationsData.data.map((simulation: AdminSimulation) => (
            <li key={simulation.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {simulation.name}
                        </h3>
                        <span
                          className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            simulation.status
                          )}`}
                        >
                          {simulation.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        by{" "}
                        {simulation.user_email ||
                          simulation.user_name ||
                          "Unknown User"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        KSH {simulation.total_cost.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {simulation.effective_combinations?.toLocaleString() ||
                          0}{" "}
                        combinations
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        Created:{" "}
                        {new Date(simulation.created_at).toLocaleDateString()}
                      </span>
                      {simulation.completed_at && (
                        <span>
                          Completed:{" "}
                          {new Date(
                            simulation.completed_at
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {simulation.status === "running" && (
                      <div className="flex items-center">
                        <div className="text-sm text-gray-500 mr-2">
                          Status: Running
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <Link
                    href={`/admin/simulations/${simulation.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {safeSimulationsData.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing page {safeSimulationsData.page} of{" "}
              {safeSimulationsData.total_pages} (
              {safeSimulationsData.total_count} total simulations)
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= safeSimulationsData.total_pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {safeSimulationsData.data.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m0 0V9a2 2 0 012-2h2a2 2 0 012 2v4m0 0h6m-9 0a1 1 0 00-1 1v5a1 1 0 001 1h2a1 1 0 001-1v-5a1 1 0 00-1-1m-6 0h6"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No simulations found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No simulations match your current filters.
          </p>
        </div>
      )}
    </div>
  );
}
