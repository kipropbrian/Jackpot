"use client";

import { useRouter } from "next/navigation";
import { useSimulations } from "@/lib/hooks/use-simulations";
import NewSimulationForm from "@/components/simulation/new-simulation-form";
import { SimulationCreate } from "@/lib/api/types";

export default function NewSimulationPage() {
  const router = useRouter();
  const { createSimulation, createError } = useSimulations({
    enablePolling: false, // Disable polling since we're only using create function
  });

  // Handler for NewSimulationForm
  const handleSimulationSubmit = async (values: SimulationCreate) => {
    try {
      console.log("Creating bet with values:", values);
      const newSimulation = await createSimulation(values);
      console.log("Bet created successfully:", newSimulation);
      router.push(`/dashboard/simulations/${newSimulation.id}`);
    } catch (err) {
      // Error is handled by the hook, just prevent navigation
      console.error("Failed to create bet:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold leading-6 text-gray-900">
            Create New Bet
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Create a bet using SportPesa rules with either budget-based or
            interactive selection.
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
                  Failed to create bet
                </h3>
                <div className="mt-2 text-sm text-red-700">{createError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="mb-6">
          <NewSimulationForm onSubmit={handleSimulationSubmit} />
        </div>

        {/* Cancel Button */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/dashboard/simulations")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
