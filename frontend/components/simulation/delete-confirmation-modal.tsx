import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Simulation } from "@/lib/api/types";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: Simulation | null;
  onConfirm: (simulationId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  simulation,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    if (simulation) {
      await onConfirm(simulation.id);
      onClose();
    }
  };

  if (!simulation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Simulation"
      size="md"
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon
              className="h-8 w-8 text-red-500"
              aria-hidden="true"
            />
          </div>
          <div>
            <h4 className="text-base font-medium text-gray-900">
              Permanently delete simulation?
            </h4>
            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Simulation Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Name:</span>
            <span className="text-sm text-gray-900">{simulation.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span className="text-sm text-gray-900 capitalize">
              {simulation.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">
              Combinations:
            </span>
            <span className="text-sm text-gray-900">
              {simulation.effective_combinations.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Cost:</span>
            <span className="text-sm text-gray-900">
              KSh{" "}
              {simulation.total_cost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Created:</span>
            <span className="text-sm text-gray-900">
              {new Date(simulation.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <ExclamationTriangleIcon
              className="h-5 w-5 text-red-400 mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="text-sm text-red-800">
              <p>
                <strong>Warning:</strong> This will permanently delete the
                simulation and all associated data including:
              </p>
              <ul className="mt-1 list-disc list-inside">
                <li>All bet combinations and specifications</li>
                <li>Results and analysis data</li>
                <li>Historical records</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </>
            ) : (
              "Delete Simulation"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
