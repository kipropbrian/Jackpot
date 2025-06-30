"use client";

import { useState } from "react";
import Link from "next/link";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { Simulation } from "@/lib/api/types";
import SimulationsListSkeleton from "@/components/simulation/simulations-list-skeleton";
import { DeleteConfirmationModal } from "@/components/simulation/delete-confirmation-modal";

export default function SimulationsPage() {
  const {
    simulations,
    totalCount,
    isLoading,
    error,
    deleteSimulation,
    isDeleting,
    refetch,
  } = useSimulations();

  // State for delete modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    simulation: Simulation | null;
  }>({
    isOpen: false,
    simulation: null,
  });

  // Helper function to safely convert to number and handle NaN
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = toNumber(amount);
    return safeAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format status for display with appropriate color using enhanced status
  const getStatusBadge = (simulation: Simulation) => {
    const statusToUse = simulation.enhanced_status || simulation.status;
    let color = "";
    let displayText = "";

    switch (statusToUse) {
      case "pending":
        color = "bg-yellow-100 text-yellow-800";
        displayText = "Pending";
        break;
      case "running":
        color = "bg-blue-100 text-blue-800";
        displayText = "Running";
        break;
      case "completed":
        color = "bg-green-100 text-green-800";
        displayText = "Completed";
        break;
      case "waiting_for_games":
        color = "bg-orange-100 text-orange-800";
        displayText = "Waiting for games";
        break;
      case "analyzing":
        color = "bg-purple-100 text-purple-800";
        displayText = "Analyzing";
        break;
      case "results_available":
        color = "bg-emerald-100 text-emerald-800";
        displayText = "Results available";
        break;
      case "failed":
        color = "bg-red-100 text-red-800";
        displayText = "Failed";
        break;
      default:
        color = "bg-gray-100 text-gray-800";
        displayText =
          statusToUse.charAt(0).toUpperCase() + statusToUse.slice(1);
    }

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}
        title={
          simulation.jackpot_name
            ? `Jackpot: ${simulation.jackpot_name}`
            : undefined
        }
      >
        {displayText}
      </span>
    );
  };

  // Handle opening delete modal
  const handleDeleteClick = (simulation: Simulation) => {
    setDeleteModal({
      isOpen: true,
      simulation,
    });
  };

  // Handle closing delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      simulation: null,
    });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async (simulationId: string) => {
    try {
      await deleteSimulation(simulationId);
    } catch (error) {
      console.error("Failed to delete simulation:", error);
      // You could add a toast notification here
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-lg leading-6 font-medium text-gray-900">
            My Simulations
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and manage your jackpot simulations
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {simulations.length} of {totalCount} simulations
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            title="Refresh simulations list"
          >
            <svg
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="ml-2">
              {isLoading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
          <Link
            href="/dashboard/simulations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Simulation
          </Link>
        </div>
      </div>

      {error && (
        <div className="border-t border-gray-200 px-4 py-3 bg-red-50 text-red-700">
          Error loading simulations: {error}
        </div>
      )}

      <div className="border-t border-gray-200">
        {isLoading ? (
          <SimulationsListSkeleton />
        ) : simulations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Effective Combinations
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cost
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Results
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {simulations.map((simulation: Simulation) => (
                  <tr key={simulation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link
                          href={`/dashboard/simulations/${simulation.id}`}
                          className="hover:text-blue-600"
                        >
                          {simulation.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusBadge(simulation)}
                        {simulation.combination_type !== "single" && (
                          <span className="ml-2 text-xs text-gray-500 capitalize">
                            {simulation.combination_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(simulation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {toNumber(
                        simulation.effective_combinations
                      ).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      KSh {formatCurrency(simulation.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {simulation.basic_results ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600 font-medium">
                              Best:{" "}
                              {toNumber(
                                simulation.basic_results.best_match_count
                              )}{" "}
                              games
                            </span>
                          </div>
                          <div
                            className={`text-xs ${
                              toNumber(simulation.basic_results.total_payout) >
                              toNumber(simulation.total_cost)
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {toNumber(simulation.basic_results.total_payout) >
                            toNumber(simulation.total_cost)
                              ? `+KSh ${(
                                  toNumber(
                                    simulation.basic_results.total_payout
                                  ) - toNumber(simulation.total_cost)
                                ).toLocaleString()}`
                              : `-KSh ${toNumber(
                                  simulation.basic_results.net_loss
                                ).toLocaleString()}`}
                          </div>
                        </div>
                      ) : simulation.enhanced_status === "results_available" ? (
                        <span className="text-gray-400 italic">
                          Click to view
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/simulations/${simulation.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(simulation)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-12 sm:px-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No simulations
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new simulation.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/simulations/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                New Simulation
              </Link>
            </div>
          </div>
        )}
      </div>

      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          simulation={deleteModal.simulation}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
