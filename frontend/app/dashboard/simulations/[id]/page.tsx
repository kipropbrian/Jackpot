"use client";

import { useState, useEffect } from "react";
import SimulationProgressBar from "@/components/simulation/SimulationProgressBar";
import ResultsAnalysisProgress from "@/components/simulation/ResultsAnalysisProgress";
import SimulationResults from "@/components/simulation/SimulationResults";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { Simulation } from "@/lib/api/types";

export default function SimulationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const {
    getSimulation,
    updateSimulation,
    deleteSimulation,
    isLoading,
    error,
  } = useSimulations({ autoFetch: false });
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Progress polling
  const [progress, setProgress] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        const data = await getSimulation(params.id);
        setSimulation(data);
      } catch (err) {
        console.error("Error fetching simulation:", err);
      }
    };

    fetchSimulation();
  }, [params.id, getSimulation]);

  // Poll for progress if simulation is running
  useEffect(() => {
    if (!simulation) return;

    // Only poll if not completed or failed
    if (simulation.status === "completed" || simulation.status === "failed") {
      setPolling(false);
      setProgress(simulation.progress);
      return;
    }

    setPolling(true);
    setProgress(simulation.progress);

    const interval = setInterval(async () => {
      try {
        const updated = await getSimulation(params.id);
        setSimulation(updated);
        setProgress(updated.progress);

        // Stop polling if now completed or failed
        if (updated.status === "completed" || updated.status === "failed") {
          setPolling(false);
          clearInterval(interval);
        }
      } catch (err) {
        // Optionally handle error
      }
    }, 5000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [simulation?.status, getSimulation, params.id]);

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
        <div className="text-red-500">
          Error loading simulation: {error.message}
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
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-lg leading-6 font-medium text-gray-900">
              {simulation.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Simulation Details
            </p>
            {/* Progress Bars */}
            <div className="mt-4 space-y-4">
              <SimulationProgressBar
                simulationId={simulation.id}
                initialProgress={simulation.progress}
                status={simulation.status}
                getSimulation={getSimulation}
                loading={isLoading}
              />
              <ResultsAnalysisProgress
                simulation={simulation}
                getSimulation={getSimulation}
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
                {simulation.status === "running" && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5 w-full">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${simulation.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {simulation.progress}% complete
                    </span>
                  </div>
                )}
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

      {/* Simulation Results */}
      {simulation.status === "completed" && (
        <SimulationResults simulation={simulation} />
      )}
    </div>
  );
}
