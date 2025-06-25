import React from "react";
import { Simulation } from "@/lib/api/types";

type SimulationProgressBarProps = {
  simulation: Simulation;
  loading?: boolean;
};

const SimulationProgressBar: React.FC<SimulationProgressBarProps> = ({
  simulation,
  loading = false,
}) => {
  const progress = simulation.progress || 0;
  const status = simulation.status;

  return (
    <div className="mt-4">
      <div className="flex items-center mb-1">
        <span className="text-xs text-gray-500 mr-2">Progress:</span>
        <span className="text-xs font-semibold text-gray-700">{progress}%</span>
        {status === "running" && (
          <span className="ml-2 text-xs text-blue-500 animate-pulse">
            (updating...)
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-300 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div
            className={`h-3 rounded-full ${
              status === "completed"
                ? "bg-green-500"
                : status === "failed"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%`, transition: "width 0.5s" }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default SimulationProgressBar;
