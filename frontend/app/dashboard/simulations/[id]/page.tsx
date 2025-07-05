"use client";

import { useState } from "react";
import SimulationResults from "@/components/simulation/SimulationResults";
import { GameCombinationsVisualization } from "@/components/simulation/game-combinations-visualization";
import SimulationDetailsSkeleton from "@/components/simulation/simulation-details-skeleton";
import DeleteConfirmationModal from "@/components/simulation/delete-confirmation-modal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSimulation,
  useSimulationMutations,
} from "@/lib/hooks/use-simulations";
import { useJackpot } from "@/lib/hooks/use-jackpot";

export default function SimulationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { simulation, loading: isLoadingSimulation } = useSimulation(params.id);
  const { jackpot, loading: isLoadingJackpot } = useJackpot(
    simulation?.jackpot_id
  );
  const { deleteSimulation } = useSimulationMutations();

  // Show skeleton while loading simulation or jackpot data
  if (isLoadingSimulation || (simulation && isLoadingJackpot)) {
    return <SimulationDetailsSkeleton />;
  }

  // Only show not found after loading is complete
  if (!simulation) {
    return (
      <div className="p-4">
        <p>Simulation not found</p>
        <Link href="/dashboard/simulations" className="text-blue-600">
          Back to simulations
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSimulation(simulation.id);
      router.push("/dashboard/simulations");
    } catch (error) {
      console.error("Failed to delete simulation:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {simulation.name || "Unnamed Simulation"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Created on{" "}
                {new Date(simulation.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/dashboard/simulations/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Make Another Bet
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Bet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Analysis */}
      <SimulationResults simulation={simulation} />

      {/* Game Combinations */}
      <GameCombinationsVisualization
        specification={simulation.specification || null}
        jackpotName={jackpot?.name}
        games={jackpot?.games || []}
        actualResults={simulation.results?.analysis?.actual_results}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        simulation={simulation}
        isDeleting={isDeleting}
      />
    </div>
  );
}
