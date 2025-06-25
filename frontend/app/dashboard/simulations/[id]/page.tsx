"use client";

import { useState, useCallback } from "react";
import SimulationProgressBar from "@/components/simulation/SimulationProgressBar";
import ResultsAnalysisProgress from "@/components/simulation/ResultsAnalysisProgress";
import SimulationResults from "@/components/simulation/SimulationResults";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSimulation, useSimulations } from "@/lib/hooks/use-simulations";

export default function SimulationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { simulation, loading, error, refetch } = useSimulation(params.id);
  const { deleteSimulation } = useSimulations(); // Only need delete function
  const [isDeleting, setIsDeleting] = useState(false);

  // React Query automatically handles polling based on simulation status

  const handleAnalysisComplete = useCallback(async () => {
    // Refresh the simulation data to get the latest results
    await refetch();
  }, [refetch]);

  const handleDelete = async () => {
    if (!simulation) return;

    if (
      window.confirm(
        "Are you sure you want to delete this simulation? This action cannot be undone."
      )
    ) {
      setIsDeleting(true);
      try {
        await deleteSimulation(simulation.id);
        router.push("/dashboard/simulations");
      } catch (err) {
        console.error("Error deleting simulation:", err);
        setIsDeleting(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  if (loading || !simulation) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-gray-500">
          {loading ? "Loading simulation..." : "Simulation not found"}
        </div>
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
              Simulation Details
            </p>
            {/* Simulation Progress Bar */}
            <div className="mt-4">
              <SimulationProgressBar
                simulation={simulation}
                loading={loading}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/simulations"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to List
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Simulation Information
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details and parameters of this simulation
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
              <dt className="text-sm font-medium text-gray-500">
                Total Combinations
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {simulation.total_combinations.toLocaleString()}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Cost Per Bet
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                KES {simulation.cost_per_bet.toLocaleString()}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Cost</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                KES {simulation.total_cost.toLocaleString()}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(simulation.created_at)}
              </dd>
            </div>
            {simulation.completed_at && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Completed At
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(simulation.completed_at)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Results Analysis Progress */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="mt-4">
            <ResultsAnalysisProgress
              simulation={simulation}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {simulation.results && (
        <div className="bg-white shadow rounded-lg p-6">
          <SimulationResults simulation={simulation} />
        </div>
      )}
    </div>
  );
}
