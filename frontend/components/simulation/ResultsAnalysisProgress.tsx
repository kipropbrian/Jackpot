import { useState, useEffect } from "react";
import { Simulation } from "@/lib/api/types";

interface ResultsAnalysisProgressProps {
  simulation: Simulation;
  getSimulation: (id: string) => Promise<Simulation>;
}

export default function ResultsAnalysisProgress({
  simulation,
  getSimulation,
}: ResultsAnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [totalCombinations, setTotalCombinations] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateProgress = async () => {
      try {
        const updatedSimulation = await getSimulation(simulation.id);
        const currentProgress = updatedSimulation.analysis_progress || 0;
        setProgress(currentProgress);
        setTotalCombinations(updatedSimulation.total_combinations || 0);
      } catch (error) {
        console.error("Error updating analysis progress:", error);
      }
    };

    // Start polling if simulation is not completed
    if (simulation.status !== "completed") {
      updateProgress();
      intervalId = setInterval(updateProgress, 2000);
    } else {
      // Set final progress when completed
      setProgress(100);
      setTotalCombinations(simulation.total_combinations || 0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [simulation.id, simulation.status, getSimulation]);

  const getStatusText = () => {
    switch (simulation.status) {
      case "pending":
        return "Waiting to start analysis...";
      case "generating":
        return "Waiting for combinations to be generated...";
      case "analyzing":
        return `Analyzing ${totalCombinations.toLocaleString()} combinations...`;
      case "completed":
        return "Analysis completed";
      case "failed":
        return "Analysis failed";
      default:
        return "Preparing for analysis...";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Analysis Progress
        </span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-500">{getStatusText()}</p>
    </div>
  );
}
