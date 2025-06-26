"use client";
import React, { useState } from "react";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { useJackpots } from "@/lib/hooks/use-jackpots";
import { Jackpot } from "@/lib/api/types";

export interface SimulationFormValues {
  name: string;
  total_combinations: number;
  cost_per_bet: number;
  jackpot_id: string;
}

interface SimulationFormProps {
  onSubmit?: (values: SimulationFormValues) => void;
}

// Predefined combination options based on simulation strategy
const COMBINATION_OPTIONS = [
  {
    value: 100,
    label: "Quick Test",
    description: "100 combinations - Fast results for testing",
  },
  {
    value: 500,
    label: "Standard",
    description: "500 combinations - Balanced accuracy and speed",
  },
  {
    value: 1000,
    label: "Enhanced",
    description: "1,000 combinations - Better statistical accuracy",
  },
  {
    value: 2500,
    label: "Comprehensive",
    description: "2,500 combinations - High accuracy analysis",
  },
  {
    value: 5000,
    label: "Professional",
    description: "5,000 combinations - Maximum accuracy (slower)",
  },
];

const SimulationForm: React.FC<SimulationFormProps> = ({ onSubmit }) => {
  const { simulations } = useSimulations();
  const {
    jackpots,
    loading: jackpotsLoading,
    error: jackpotsError,
  } = useJackpots();

  const [selectedJackpot, setSelectedJackpot] = useState<Jackpot | null>(null);
  const [selectedCombinations, setSelectedCombinations] = useState(500); // Default to Standard
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ jackpot_id?: string }>({});

  // Auto-generate simulation name based on selections
  const generateSimulationName = (
    jackpot: Jackpot | null,
    combinations: number
  ): string => {
    if (!jackpot) return "";

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // Count today's simulations for this user
    const todayISO = today.toISOString().slice(0, 10);
    const todaysCount = simulations.filter(
      (sim) => sim.created_at && sim.created_at.slice(0, 10) === todayISO
    ).length;

    const sequenceNumber = (todaysCount + 1).toString().padStart(2, "0");
    const combinationsShort =
      combinations >= 1000
        ? `${combinations / 1000}K`
        : combinations.toString();

    return `SIM${sequenceNumber}-${dateStr}-MEGA-${combinationsShort}`;
  };

  const handleJackpotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jackpotId = e.target.value;
    const jackpot = jackpots?.find((j) => j.id === jackpotId) || null;
    setSelectedJackpot(jackpot);
    setErrors({});
  };

  // Use the main jackpot bet amount (typically 17/17 or the first available)
  const getBetAmount = (): number => {
    if (!selectedJackpot?.metadata?.bet_amounts) {
      return 99; // Fallback based on typical jackpot bet amount
    }

    // Try to get 17/17 bet amount first, then any available bet amount
    const betAmounts = selectedJackpot.metadata.bet_amounts;
    return betAmounts["17/17"] || Object.values(betAmounts)[0] || 99;
  };

  const calculateTotalCost = (): number => {
    return selectedCombinations * getBetAmount();
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};

    if (!selectedJackpot) {
      errs.jackpot_id = "Please select a jackpot";
    } else if (selectedJackpot.status === "completed") {
      errs.jackpot_id = "Cannot create simulation for completed jackpots";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted, validating...");

    if (!validate()) {
      console.log("Validation failed");
      return;
    }

    console.log("Validation passed, starting submission...");
    setSubmitting(true);
    try {
      if (onSubmit && selectedJackpot) {
        const simulationName = generateSimulationName(
          selectedJackpot,
          selectedCombinations
        );
        const formData = {
          name: simulationName,
          total_combinations: selectedCombinations,
          cost_per_bet: getBetAmount(),
          jackpot_id: selectedJackpot.id,
        };
        console.log("Calling onSubmit with:", formData);
        await onSubmit(formData);
      } else {
        console.log("Missing onSubmit or selectedJackpot", {
          onSubmit: !!onSubmit,
          selectedJackpot: !!selectedJackpot,
        });
      }
    } catch (error) {
      console.error("Error in form submit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency = "KSH") => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const selectedOption = COMBINATION_OPTIONS.find(
    (opt) => opt.value === selectedCombinations
  );

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">
          Create Jackpot Simulation
        </h2>
        <p className="text-blue-100 mt-2">
          Simulate betting combinations and analyze potential outcomes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Jackpot Selection */}
        <div>
          <label className="block text-gray-700 font-semibold mb-3">
            Select Jackpot
          </label>
          <select
            value={selectedJackpot?.id || ""}
            onChange={handleJackpotChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 ${
              errors.jackpot_id ? "border-red-500" : "border-gray-300"
            }`}
            disabled={jackpotsLoading}
          >
            <option value="">Choose a jackpot to simulate...</option>
            {jackpots &&
              jackpots.map((jackpot) => (
                <option key={jackpot.id} value={jackpot.id}>
                  {jackpot.name} -{" "}
                  {formatCurrency(
                    jackpot.current_amount,
                    jackpot.metadata?.currency
                  )}{" "}
                  - {jackpot.status}
                </option>
              ))}
          </select>
          {errors.jackpot_id && (
            <div className="text-red-600 text-sm mt-2">{errors.jackpot_id}</div>
          )}
          {jackpotsError && (
            <div className="text-red-600 text-sm mt-2">
              Failed to load jackpots
            </div>
          )}
        </div>

        {/* Jackpot Details and Configuration */}
        {selectedJackpot && (
          <div className="space-y-8">
            {/* Jackpot Overview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-4">
                Selected Jackpot Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">
                    Total Games:
                  </span>
                  <div className="text-gray-900 text-lg font-semibold">
                    {selectedJackpot.total_matches}
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Status:</span>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedJackpot.status === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedJackpot.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Currency:</span>
                  <div className="text-gray-900 text-lg font-semibold">
                    {selectedJackpot.metadata?.currency || "KSH"}
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Bet Amount:</span>
                  <div className="text-gray-900 text-lg font-semibold">
                    {formatCurrency(
                      getBetAmount(),
                      selectedJackpot.metadata?.currency
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Structure */}
            {selectedJackpot.metadata?.prizes &&
              Object.keys(selectedJackpot.metadata.prizes).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-2 text-lg">
                    Prize Structure
                  </h3>
                  <p className="text-sm text-green-700 mb-6">
                    Your simulation will test combinations against all games.
                    Winnings depend on prediction accuracy:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-5">
                    {Object.entries(selectedJackpot.metadata.prizes)
                      .sort(
                        ([a], [b]) =>
                          parseInt(b.split("/")[0]) - parseInt(a.split("/")[0])
                      )
                      .map(([tier, prize]) => {
                        const isJackpot = tier === "17/17";
                        return (
                          <div
                            key={tier}
                            className={`p-5 rounded-xl border-2 transition-all duration-200 min-h-[150px] flex flex-col justify-between ${
                              isJackpot
                                ? "border-green-400 bg-gradient-to-br from-green-100 to-green-200 shadow-lg"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                            }`}
                          >
                            <div className="text-center mb-3">
                              <div
                                className={`text-sm font-bold mb-1 ${
                                  isJackpot ? "text-green-700" : "text-gray-600"
                                }`}
                              >
                                {tier} Correct {isJackpot && "🎯"}
                              </div>
                              {isJackpot && (
                                <div className="text-xs text-green-600 font-medium uppercase tracking-wide">
                                  JACKPOT
                                </div>
                              )}
                            </div>
                            <div
                              className={`text-center flex-1 ${
                                isJackpot ? "text-green-800" : "text-gray-900"
                              }`}
                            >
                              <div className="text-sm font-bold leading-tight mb-1">
                                {selectedJackpot.metadata?.currency || "KSH"}
                              </div>
                              <div className="text-2xl font-extrabold leading-tight mb-1">
                                {(prize / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-gray-500 break-words leading-tight">
                                {formatCurrency(prize, "")}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            {/* Simulation Strategy */}
            <div>
              <label className="block text-gray-700 font-semibold mb-4 text-lg">
                Simulation Strategy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-5">
                {COMBINATION_OPTIONS.map((option) => {
                  const isSelected = option.value === selectedCombinations;

                  return (
                    <div
                      key={option.value}
                      onClick={() => setSelectedCombinations(option.value)}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg min-h-[150px] flex flex-col justify-between ${
                        isSelected
                          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg"
                          : "border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50"
                      }`}
                    >
                      <div className="text-center flex-1 flex flex-col justify-center">
                        <div
                          className={`font-bold mb-2 text-lg ${
                            isSelected ? "text-purple-700" : "text-gray-800"
                          }`}
                        >
                          {option.label}
                        </div>
                        <div
                          className={`text-2xl font-extrabold mb-3 ${
                            isSelected ? "text-purple-800" : "text-gray-900"
                          }`}
                        >
                          {option.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-Generated Simulation Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3 text-lg">
                Generated Simulation Name
              </label>
              <div className="px-6 py-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-mono text-lg break-all">
                {generateSimulationName(
                  selectedJackpot,
                  selectedCombinations
                ) || "Name will be generated automatically"}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Format: SIM[##]-[DATE]-MEGA-[COMBINATIONS]
              </div>
            </div>

            {/* Simulation Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                Simulation Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Games to Predict
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedJackpot.total_matches}
                  </div>
                  <div className="text-xs text-gray-500">matches</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Cost per Combination
                  </div>
                  <div className="text-2xl font-bold text-gray-900 break-words">
                    {formatCurrency(
                      getBetAmount(),
                      selectedJackpot.metadata?.currency
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Total Combinations
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedCombinations.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Total Investment
                  </div>
                  <div className="text-2xl font-bold text-blue-600 break-words">
                    {formatCurrency(
                      calculateTotalCost(),
                      selectedJackpot.metadata?.currency
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800 leading-relaxed">
                  <strong>How it works:</strong> The simulation will generate{" "}
                  {selectedCombinations.toLocaleString()} random betting
                  combinations. Each combination predicts outcomes for all{" "}
                  {selectedJackpot.total_matches} games. Winnings are calculated
                  based on prediction accuracy (13-17 correct predictions).
                </div>
              </div>

              {selectedOption && (
                <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm text-purple-800 leading-relaxed">
                    <strong>Strategy:</strong> {selectedOption.label} -{" "}
                    {selectedOption.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg text-lg"
            disabled={submitting || jackpotsLoading || !selectedJackpot}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Creating Simulation...
              </span>
            ) : (
              `Create Simulation${
                selectedJackpot
                  ? ` • ${formatCurrency(
                      calculateTotalCost(),
                      selectedJackpot.metadata?.currency
                    )}`
                  : ""
              }`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimulationForm;
