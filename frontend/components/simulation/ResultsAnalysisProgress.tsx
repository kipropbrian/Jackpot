import { useState, useEffect } from "react";
import { Simulation } from "@/lib/api/types";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { useJackpot } from "@/lib/hooks/use-jackpot";

interface ResultsAnalysisProgressProps {
  simulation: Simulation;
  onAnalysisComplete?: () => void;
}

export default function ResultsAnalysisProgress({
  simulation,
  onAnalysisComplete,
}: ResultsAnalysisProgressProps) {
  const [hasTriggeredAnalysis, setHasTriggeredAnalysis] = useState(false);
  const { updateSimulation } = useSimulations();
  const {
    jackpot,
    loading: jackpotLoading,
    error: jackpotError,
  } = useJackpot(simulation.jackpot_id);

  const jackpotStatus = jackpot?.status as "open" | "completed" | null;
  const error = jackpotError;

  // Trigger analysis when conditions are met
  useEffect(() => {
    const shouldTriggerAnalysis =
      !jackpotLoading &&
      simulation.status === "completed" &&
      !simulation.results &&
      jackpotStatus === "completed" &&
      !hasTriggeredAnalysis &&
      !error;

    if (shouldTriggerAnalysis) {
      const triggerAnalysis = async () => {
        try {
          setHasTriggeredAnalysis(true);
          await updateSimulation(simulation.id, { status: "completed" });
        } catch (error) {
          console.error("Error triggering analysis:", error);
          setHasTriggeredAnalysis(false);
        }
      };
      triggerAnalysis();
    }
  }, [
    jackpotLoading,
    simulation.status,
    simulation.results,
    jackpotStatus,
    hasTriggeredAnalysis,
    error,
    simulation.id,
    updateSimulation,
  ]);

  // Check if analysis is complete and notify parent
  useEffect(() => {
    if (
      simulation.results &&
      simulation.results.length > 0 &&
      onAnalysisComplete
    ) {
      onAnalysisComplete();
    }
  }, [simulation.results, onAnalysisComplete]);

  const getStatusText = () => {
    if (error) {
      return error;
    }

    if (jackpotLoading) {
      return "Loading jackpot status...";
    }

    if (jackpotStatus === "open") {
      return "Waiting for all games to be played before analysis can start...";
    }

    if (simulation.results && simulation.results.length > 0) {
      return "Analysis completed";
    }

    if (hasTriggeredAnalysis) {
      return `Analyzing ${simulation.total_combinations.toLocaleString()} combinations...`;
    }

    return "Ready for analysis";
  };

  // Don't show progress bar if:
  // 1. Simulation is not completed yet
  // 2. Results already exist
  // 3. There's an error
  if (
    simulation.status !== "completed" ||
    (simulation.results && simulation.results.length > 0) ||
    error
  ) {
    return <div className="text-sm text-gray-500">{getStatusText()}</div>;
  }

  // Show progress bar
  const progress = simulation.progress || 0;
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
      <p className="mt-2 text-xs text-gray-500">{getStatusText()}</p>
    </div>
  );
}
