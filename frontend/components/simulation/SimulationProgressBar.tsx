import React from 'react';
import { Simulation } from '@/lib/api/types';

type SimulationProgressBarProps = {
  simulationId: string;
  initialProgress: number;
  status: string;
  getSimulation: (id: string) => Promise<Simulation>;
  loading?: boolean;
};

const SimulationProgressBar: React.FC<SimulationProgressBarProps> = ({
  simulationId,
  initialProgress,
  status,
  getSimulation,
  loading = false,
}) => {
  const [progress, setProgress] = React.useState(initialProgress);
  const [currentStatus, setCurrentStatus] = React.useState(status);

  React.useEffect(() => {
    setProgress(initialProgress);
    setCurrentStatus(status);
    if (status === 'completed' || status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const updated = await getSimulation(simulationId);
        setProgress(updated.progress);
        setCurrentStatus(updated.status);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        // handle error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [simulationId, status, initialProgress, getSimulation]);

  return (
    <div className="mt-4">
      <div className="flex items-center mb-1">
        <span className="text-xs text-gray-500 mr-2">Progress:</span>
        <span className="text-xs font-semibold text-gray-700">
          {progress}%
        </span>
        {currentStatus === 'running' && (
          <span className="ml-2 text-xs text-blue-500 animate-pulse">(updating...)</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-300 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div
            className={`h-3 rounded-full ${currentStatus === 'completed'
              ? 'bg-green-500'
              : currentStatus === 'failed'
                ? 'bg-red-500'
                : 'bg-blue-500'
              }`}
            style={{ width: `${progress}%`, transition: 'width 0.5s' }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default SimulationProgressBar;
