"use client";

import { useRouter } from "next/navigation";
import { useSimulations } from "@/lib/hooks/use-simulations";
import SimulationForm from "@/components/simulation/simulation-form";

export default function NewSimulationPage() {
  const router = useRouter();
  const { createSimulation, createError, isCreating } = useSimulations();

  // Handler for SimulationForm
  const handleSimulationSubmit = async (values: {
    name: string;
    total_combinations: number;
    cost_per_bet: number;
    jackpot_id: string;
  }) => {
    try {
      console.log("Creating simulation with values:", values);
      const newSimulation = await createSimulation(values);
      console.log("Simulation created successfully:", newSimulation);
      router.push(`/dashboard/simulations/${newSimulation.id}`);
    } catch (err) {
      // Error is handled by the hook, just prevent navigation
      console.error("Failed to create simulation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold leading-6 text-gray-900">
            Create New Simulation
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Set up parameters for your jackpot simulation. Choose an active
            jackpot and define your betting strategy.
          </p>
        </div>

        {/* Error Display */}
        {createError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to create simulation
                </h3>
                <div className="mt-2 text-sm text-red-700">{createError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Simulation Form */}
        <div className="mb-6">
          <SimulationForm onSubmit={handleSimulationSubmit} />
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-3 px-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            disabled={isCreating}
          >
            ← Cancel & Go Back
          </button>
        </div>

        {/* Information Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            How Simulations Work
          </h3>
          <div className="text-sm text-gray-600">
            <p className="mb-4">
              After creating a simulation, our system will:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Generate the specified number of random bet combinations for
                  your selected jackpot
                </li>
                <li>
                  Simulate each combination against the actual jackpot results
                  (when available)
                </li>
                <li>
                  Calculate win/loss statistics, total payouts, and expected
                  returns
                </li>
              </ol>
              <ol className="list-decimal list-inside space-y-2" start={4}>
                <li>
                  Provide detailed analysis including match distribution and
                  profitability metrics
                </li>
                <li>
                  Show you the best performing combinations and overall
                  simulation performance
                </li>
              </ol>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Simulations for open jackpots will be
                processed once the jackpot closes and results are available. You
                can track the progress of your simulation in the simulations
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
