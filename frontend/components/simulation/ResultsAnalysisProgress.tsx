import { useState, useEffect } from "react";
import { Simulation } from "@/lib/api/types";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { JackpotService } from "@/lib/api/services/jackpot-service";

interface ResultsAnalysisProgressProps {
  simulation: Simulation;
  getSimulation: (id: string) => Promise<Simulation>;
  onAnalysisComplete?: (updatedSimulation: Simulation) => void;
}

export default function ResultsAnalysisProgress({
  simulation,
  getSimulation,
  onAnalysisComplete,
}: ResultsAnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [totalCombinations, setTotalCombinations] = useState(0);
  const [jackpotStatus, setJackpotStatus] = useState<
    "open" | "completed" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const { updateSimulation: triggerResultsAnalysis } = useSimulations({
    autoFetch: false,
  });

  // Fetch jackpot status when component mounts
  useEffect(() => {
    const fetchJackpotStatus = async () => {
      try {
        const jackpot = await JackpotService.getJackpot(simulation.jackpot_id);
        setJackpotStatus(jackpot.status as "open" | "completed");
        setError(null);
        setErrorCount(0);
      } catch (error) {
        console.error("Error fetching jackpot status:", error);
        setError("Failed to fetch jackpot status");
        setErrorCount((prev) => prev + 1);
      }
    };
    fetchJackpotStatus();
  }, [simulation.jackpot_id]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateProgress = async () => {
      try {
        const updatedSimulation = await getSimulation(simulation.id);
        const currentProgress = updatedSimulation.progress || 0;
        setProgress(currentProgress);
        setTotalCombinations(updatedSimulation.total_combinations || 0);
        setError(null);
        setErrorCount(0);

        // If simulation is completed but analysis hasn't started, trigger it
        if (
          updatedSimulation.status === "completed" &&
          !updatedSimulation.results &&
          jackpotStatus === "completed"
        ) {
          // Update status to trigger analysis
          await triggerResultsAnalysis(simulation.id, { status: "completed" });
        }

        // Stop polling and notify parent if:
        // 1. Results exist and are complete
        // 2. Status is failed
        // 3. Progress is 100% and results exist
        if (
          (updatedSimulation.results && updatedSimulation.results.length > 0) ||
          updatedSimulation.status === "failed" ||
          (currentProgress === 100 && updatedSimulation.results)
        ) {
          clearInterval(intervalId);
          onAnalysisComplete?.(updatedSimulation);
          return;
        }
      } catch (error) {
        console.error("Error updating analysis progress:", error);
        setError("Failed to update analysis progress");
        setErrorCount((prev) => prev + 1);

        // Only clear interval if we've had multiple consecutive errors
        if (errorCount >= 3) {
          clearInterval(intervalId);
        }
      }
    };

    // Start polling if:
    // 1. Simulation is completed
    // 2. No results yet or results are empty
    // 3. Jackpot is completed
    // 4. Progress is not 100% or results don't exist yet
    // 5. Not in a permanent error state (3+ consecutive errors)
    if (
      simulation.status === "completed" &&
      (!simulation.results || simulation.results.length === 0) &&
      jackpotStatus === "completed" &&
      (progress < 100 || !simulation.results) &&
      errorCount < 3
    ) {
      updateProgress();
      intervalId = setInterval(updateProgress, 2000);
    } else if (simulation.results || simulation.progress === 100) {
      // Set final progress when results are available or progress is complete
      setProgress(jackpotStatus === "completed" ? 100 : 0);
      setTotalCombinations(simulation.total_combinations || 0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    simulation.id,
    simulation.status,
    simulation.results,
    simulation.progress,
    simulation.total_combinations,
    progress,
    getSimulation,
    triggerResultsAnalysis,
    jackpotStatus,
    onAnalysisComplete,
    errorCount,
  ]);

  const getStatusText = () => {
    if (error) {
      return errorCount >= 3
        ? "Analysis failed. Please try refreshing the page."
        : `${error}. Retrying...`;
    }

    if (jackpotStatus === "open") {
      return "Waiting for all games to be played before analysis can start...";
    }

    if (simulation.results && simulation.results.length > 0) {
      return "Analysis completed";
    }

    if (progress === 100) {
      return "Analysis completed";
    }

    if (!simulation.results && simulation.status === "completed") {
      return `Analyzing ${totalCombinations.toLocaleString()} combinations...`;
    }

    return "Preparing for analysis...";
  };

  // Don't show progress bar if:
  // 1. Simulation is not completed yet
  // 2. Results already exist
  // 3. There's a permanent error (3+ consecutive errors)
  if (
    simulation.status !== "completed" ||
    (simulation.results && simulation.results.length > 0) ||
    errorCount >= 3
  ) {
    return null;
  }

  // Show actual progress only if jackpot is completed
  const displayProgress = jackpotStatus === "completed" ? progress : 0;

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center mb-1">
        <span className="text-xs text-gray-500 mr-2">Analysis Progress:</span>
        <span className="text-xs font-semibold text-gray-700">
          {displayProgress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-300">
        <div
          className="bg-purple-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${displayProgress}%` }}
        ></div>
      </div>
      <p
        className={`mt-2 text-xs ${
          errorCount >= 3
            ? "text-red-500"
            : error
            ? "text-yellow-500"
            : "text-gray-500"
        }`}
      >
        {getStatusText()}
      </p>
    </div>
  );
}
