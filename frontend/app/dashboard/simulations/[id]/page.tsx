"use client";

import { useState } from "react";
import SimulationResults from "@/components/simulation/SimulationResults";
import { GameCombinationsVisualization } from "@/components/simulation/game-combinations-visualization";
import SimulationDetailsSkeleton from "@/components/simulation/simulation-details-skeleton";
import { DeleteConfirmationModal } from "@/components/simulation/delete-confirmation-modal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSimulation,
  useSimulationMutations,
} from "@/lib/hooks/use-simulations";

export default function SimulationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { simulation, loading, error } = useSimulation(params.id);
  const { deleteSimulation, isDeleting } = useSimulationMutations();

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async (simulationId: string) => {
    try {
      await deleteSimulation(simulationId);
      router.push("/dashboard/simulations");
    } catch (err) {
      console.error("Error deleting simulation:", err);
    }
  };

  // Format status for display with appropriate color using enhanced status
  const getStatusBadge = (simulation: {
    enhanced_status?: string;
    status: string;
    jackpot_name?: string;
  }) => {
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

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-red-500">Error loading simulation: {error}</div>
        <div className="mt-4">
          <Link
            href="/dashboard/simulations"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to simulations
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <SimulationDetailsSkeleton />;
  }

  if (!simulation) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-gray-500">Simulation not found</div>
        <div className="mt-4">
          <Link
            href="/dashboard/simulations"
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
      {/* Header with basic info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-lg leading-6 font-medium text-gray-900">
              {simulation.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Specification-based simulation - {simulation.combination_type}{" "}
              combinations
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/simulations"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to List
            </Link>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results - MOVED TO THE TOP */}
      {simulation.results && <SimulationResults simulation={simulation} />}

      {/* Game Combinations Visualization */}
      <GameCombinationsVisualization
        specification={simulation.specification || null}
        jackpotName={simulation?.jackpot_name}
      />

      {/* Enhanced status messages */}
      {simulation.enhanced_status === "waiting_for_games" && (
        <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Waiting for Games to Complete
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  Your simulation is ready, but the jackpot &quot;
                  {simulation.jackpot_name || "Unknown"}&quot; games are still
                  in progress. Analysis will be available once all games are
                  completed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {simulation.enhanced_status === "analyzing" && (
        <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-purple-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">
                Analysis in Progress
              </h3>
              <div className="mt-2 text-sm text-purple-700">
                <p>
                  Your simulation is being analyzed automatically. Results will
                  appear here once the analysis is complete. This usually takes
                  a few moments depending on the number of combinations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Details - MOVED TO THE BOTTOM */}
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
                {getStatusBadge(simulation)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Combination Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                {simulation.combination_type}
                {simulation.combination_type === "mixed" && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({simulation.double_count} doubles,{" "}
                    {simulation.triple_count} triples)
                  </span>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Effective Combinations
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {simulation.effective_combinations.toLocaleString()}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Cost</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                KSh {simulation.total_cost.toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        simulation={simulation}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
