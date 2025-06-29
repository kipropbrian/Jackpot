"use client";

import { useState } from "react";
import SimulationResults from "@/components/simulation/SimulationResults";
import SimulationDetailsSkeleton from "@/components/simulation/simulation-details-skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSimulation, useSimulations } from "@/lib/hooks/use-simulations";
import { useJackpot } from "@/lib/hooks/use-jackpot";

export default function SimulationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { simulation, loading, error, refetch } = useSimulation(params.id);
  const { jackpot, loading: jackpotLoading } = useJackpot(
    simulation?.jackpot_id
  );
  const { deleteSimulation, analyzeSimulation } = useSimulations();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!simulation) return;

    setIsAnalyzing(true);
    try {
      await analyzeSimulation(simulation.id);
      await refetch(); // Refresh to get latest status
    } catch (err) {
      console.error("Error starting analysis:", err);
      // Extract and display the actual error message
      const errorMessage = (() => {
        if (err && typeof err === "object" && "response" in err) {
          return (err as { response: { data: { detail?: string } } }).response
            ?.data?.detail;
        }
        if (err instanceof Error) {
          return err.message;
        }
        return "Unknown error occurred";
      })();
      alert(`Failed to start analysis: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  if (loading || jackpotLoading) {
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
            {simulation.status === "completed" &&
              !simulation.results &&
              jackpot?.status === "completed" && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Results"}
                </button>
              )}
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
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(simulation.created_at)}
              </dd>
            </div>
            {simulation.completed_at && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Completed</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(simulation.completed_at)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Analysis Results */}
      {simulation.results && <SimulationResults simulation={simulation} />}

      {/* Status messages */}
      {simulation.status === "completed" && !simulation.results && (
        <div
          className={`border rounded-lg p-4 ${
            jackpot?.status === "completed"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className={`h-5 w-5 ${
                  jackpot?.status === "completed"
                    ? "text-yellow-400"
                    : "text-blue-400"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${
                  jackpot?.status === "completed"
                    ? "text-yellow-800"
                    : "text-blue-800"
                }`}
              >
                {jackpot?.status === "completed"
                  ? "Analysis Ready"
                  : "Waiting for Jackpot Results"}
              </h3>
              <div
                className={`mt-2 text-sm ${
                  jackpot?.status === "completed"
                    ? "text-yellow-700"
                    : "text-blue-700"
                }`}
              >
                <p>
                  {jackpot?.status === "completed"
                    ? 'This simulation is completed and ready for analysis. Click "Analyze Results" to compare your combinations against the actual jackpot results.'
                    : `Simulation is completed, but the jackpot "${
                        jackpot?.name || "Unknown"
                      }" is still ${
                        jackpot?.status || "pending"
                      }. Analysis will be available once the jackpot is completed.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
