"use client";

import { useRouter } from "next/navigation";
import { useSimulations } from "@/lib/hooks/use-simulations";
import SimulationForm from "@/components/simulation/simulation-form";

export default function NewSimulationPage() {
  const router = useRouter();
  const { createSimulation, isLoading, error } = useSimulations({
    autoFetch: false,
  });

  // Handler for SimulationForm
  const handleSimulationSubmit = async (values: {
    name: string;
    total_combinations: number;
    cost_per_bet: number;
  }) => {
    const newSimulation = await createSimulation(values);
    router.push(`/dashboard/simulations/${newSimulation.id}`);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-lg leading-6 font-medium text-gray-900">
          Create New Simulation
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Set up parameters for your jackpot simulation
        </p>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error.message}
          </div>
        )}
        <SimulationForm onSubmit={handleSimulationSubmit} />
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">
          What happens next?
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>After creating a simulation, our system will:</p>
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>Generate the specified number of random bet combinations</li>
            <li>Simulate each combination against historical jackpot data</li>
            <li>Calculate win/loss statistics and expected returns</li>
            <li>Provide detailed analysis of simulation results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
