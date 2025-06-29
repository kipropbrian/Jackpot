"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { useJackpots } from "@/lib/hooks/use-jackpots";
import {
  Jackpot,
  SimulationCreate,
  SportPesaRules,
  GameSelectionValidation,
  Simulation,
} from "@/lib/api/types";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface NewSimulationFormProps {
  onSubmit?: (values: SimulationCreate) => void;
}

type CreationMethod = "budget" | "interactive";
type GameSelection = "1" | "X" | "2";

interface GameSelectionState {
  [gameNumber: string]: GameSelection[];
}

// SportPesa rules (matching backend)
const SPORTPESA_RULES: SportPesaRules = {
  maxOnlyDoubles: 10,
  maxOnlyTriples: 5,
  maxCombiningDoubles: 9,
  maxCombiningTriples: 5,
  costPerBet: 99,
};

const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #3B82F6;
    border: 3px solid #ffffff;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  .slider::-webkit-slider-track {
    width: 100%;
    height: 12px;
    cursor: pointer;
    background: linear-gradient(to right, #E5E7EB 0%, #3B82F6 100%);
    border-radius: 6px;
  }

  .slider::-moz-range-thumb {
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #3B82F6;
    border: 3px solid #ffffff;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  .slider::-moz-range-track {
    width: 100%;
    height: 12px;
    cursor: pointer;
    background: linear-gradient(to right, #E5E7EB 0%, #3B82F6 100%);
    border-radius: 6px;
  }
`;

const NewSimulationForm: React.FC<NewSimulationFormProps> = ({ onSubmit }) => {
  const { simulations } = useSimulations();
  const { jackpots, loading: jackpotsLoading } = useJackpots();

  // Form state
  const [selectedJackpot, setSelectedJackpot] = useState<Jackpot | null>(null);
  const [creationMethod, setCreationMethod] =
    useState<CreationMethod>("budget");
  const [budgetKsh, setBudgetKsh] = useState<number>(500);
  const [gameSelections, setGameSelections] = useState<GameSelectionState>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation state
  const [validation, setValidation] = useState<GameSelectionValidation | null>(
    null
  );

  // Auto-generate simulation name
  const generateSimulationName = (
    jackpot: Jackpot | null,
    method: CreationMethod
  ): string => {
    if (!jackpot) return "";

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const todaysCount = simulations.filter(
      (sim: Simulation) =>
        sim.created_at && sim.created_at.slice(0, 10) === dateStr
    ).length;
    const sequenceNumber = (todaysCount + 1).toString().padStart(2, "0");

    const methodCode = method === "budget" ? "BUD" : "INT";
    return `SIM${sequenceNumber}-${dateStr}-${methodCode}`;
  };

  // Initialize game selections for selected jackpot
  useEffect(() => {
    if (selectedJackpot && creationMethod === "interactive") {
      const initialSelections: GameSelectionState = {};
      for (let i = 1; i <= (selectedJackpot.total_matches || 17); i++) {
        initialSelections[i.toString()] = ["1"]; // Default to home win
      }
      setGameSelections(initialSelections);
    }
  }, [selectedJackpot, creationMethod]);

  const validateGameSelections = useCallback(async () => {
    if (!selectedJackpot) return;

    try {
      // Call validation API using the API client
      const response = await apiClient.post(API_ENDPOINTS.VALIDATE_SELECTIONS, {
        game_selections: gameSelections,
        jackpot_id: selectedJackpot.id,
      });

      if (response.data) {
        setValidation(response.data);
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
  }, [selectedJackpot, gameSelections]);

  // Validate interactive selections
  useEffect(() => {
    if (
      creationMethod === "interactive" &&
      selectedJackpot &&
      Object.keys(gameSelections).length > 0
    ) {
      validateGameSelections();
    }
  }, [gameSelections, selectedJackpot, creationMethod, validateGameSelections]);

  const toggleGameSelection = (
    gameNumber: string,
    selection: GameSelection
  ) => {
    setGameSelections((prev) => {
      const currentSelections = prev[gameNumber] || [];
      const newSelections = currentSelections.includes(selection)
        ? currentSelections.filter((s) => s !== selection)
        : [...currentSelections, selection].sort();

      return {
        ...prev,
        [gameNumber]: newSelections.length > 0 ? newSelections : ["1"], // Always have at least one selection
      };
    });
  };

  const getGameSelectionColor = (
    gameNumber: string,
    selection: GameSelection
  ): string => {
    const currentSelections = gameSelections[gameNumber] || [];
    const isSelected = currentSelections.includes(selection);

    if (isSelected) {
      if (currentSelections.length === 1) return "bg-blue-500 text-white"; // Single
      if (currentSelections.length === 2) return "bg-purple-500 text-white"; // Double
      if (currentSelections.length === 3) return "bg-orange-500 text-white"; // Triple
    }

    return "bg-gray-100 text-gray-700 hover:bg-gray-200";
  };

  const getGameBadgeColor = (gameNumber: string): string => {
    const selectionCount = gameSelections[gameNumber]?.length || 1;
    switch (selectionCount) {
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-purple-100 text-purple-800";
      case 3:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSelectionTypeName = (count: number): string => {
    switch (count) {
      case 1:
        return "Single";
      case 2:
        return "Double";
      case 3:
        return "Triple";
      default:
        return "Invalid";
    }
  };

  const calculateBudgetCombinations = (): number => {
    return Math.floor(budgetKsh / SPORTPESA_RULES.costPerBet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      const simulationData: SimulationCreate = {
        name: generateSimulationName(selectedJackpot, creationMethod),
        jackpot_id: selectedJackpot!.id,
      };

      if (creationMethod === "budget") {
        simulationData.budget_ksh = budgetKsh;
      } else {
        simulationData.game_selections = gameSelections;
      }

      if (onSubmit) {
        await onSubmit(simulationData);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedJackpot) {
      newErrors.jackpot = "Please select a jackpot";
    }

    if (creationMethod === "budget") {
      if (budgetKsh < SPORTPESA_RULES.costPerBet) {
        newErrors.budget = `Minimum budget is ${SPORTPESA_RULES.costPerBet} KSh`;
      }
    } else {
      if (validation && !validation.is_valid) {
        newErrors.selections = validation.errors.join(", ");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrency = (amount: number): string => {
    return `KSh ${amount.toLocaleString()}`;
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Create Simulation</h2>
        <p className="text-blue-100 mt-2">
          Create a bet simulation using SportPesa rules
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Jackpot Selection */}
        <div>
          <label className="block text-gray-700 font-semibold mb-4">
            Select Jackpot
          </label>

          {jackpotsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="p-6 border-2 border-gray-200 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jackpots
                ?.filter((j) => j.status === "open")
                .map((jackpot) => (
                  <div
                    key={jackpot.id}
                    onClick={() => setSelectedJackpot(jackpot)}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedJackpot?.id === jackpot.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : errors.jackpot
                        ? "border-red-300 hover:border-red-400"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {/* Jackpot Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedJackpot?.id === jackpot.id
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-400"
                        }`}
                      >
                        {selectedJackpot?.id === jackpot.id && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>

                    {/* Jackpot Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                      {jackpot.name}
                    </h3>

                    {/* Prize Amount */}
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">Prize Pool</span>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(jackpot.current_amount)}
                      </div>
                      {jackpot.metadata?.currency && (
                        <span className="text-xs text-gray-500">
                          {jackpot.metadata.currency}
                        </span>
                      )}
                    </div>

                    {/* Games Count */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Games:</span>
                      <span className="font-medium text-gray-900">
                        {jackpot.total_matches} matches
                      </span>
                    </div>

                    {/* Bet Amount */}
                    {jackpot.metadata?.bet_amounts && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Cost per bet:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(
                            jackpot.metadata.bet_amounts["17/17"] ||
                              Object.values(jackpot.metadata.bet_amounts)[0] ||
                              99
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* No Jackpots Message */}
          {!jackpotsLoading &&
            (!jackpots ||
              jackpots.filter((j) => j.status === "open").length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-400 text-4xl mb-4">🎰</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Jackpots
                </h3>
                <p className="text-gray-500">
                  There are currently no active jackpots available for
                  simulation.
                </p>
              </div>
            )}

          {errors.jackpot && (
            <p className="text-red-600 text-sm mt-3">{errors.jackpot}</p>
          )}
        </div>

        {/* Creation Method Selection */}
        {selectedJackpot && (
          <div>
            <label className="block text-gray-700 font-semibold mb-4">
              Creation Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setCreationMethod("budget")}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  creationMethod === "budget"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center mb-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      creationMethod === "budget"
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-400"
                    }`}
                  />
                  <h3 className="font-semibold text-gray-800">Budget-Based</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Set your budget and let the system optimize combination
                  distribution
                </p>
              </div>

              <div
                onClick={() => setCreationMethod("interactive")}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  creationMethod === "interactive"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center mb-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      creationMethod === "interactive"
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-400"
                    }`}
                  />
                  <h3 className="font-semibold text-gray-800">
                    Interactive Selection
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Manually select predictions for each game with full control
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Method */}
        {selectedJackpot && creationMethod === "budget" && (
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Budget: {formatCurrency(budgetKsh)}
            </label>

            {/* Budget Slider */}
            <div className="space-y-4">
              <input
                type="range"
                min={SPORTPESA_RULES.costPerBet}
                max={770424} // SportPesa theoretical max: 7,776 combinations (5 doubles + 5 triples)
                step={SPORTPESA_RULES.costPerBet}
                value={budgetKsh}
                onChange={(e) => setBudgetKsh(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />

              {/* Slider Labels */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>KSh 99 (1 bet)</span>
                <span>KSh 770,424 (7,776 bets - SportPesa Max)</span>
              </div>

              {/* Quick Preset Buttons - Based on SportPesa Rules */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "1 Bet", value: 99, desc: "Single bet" },
                  { label: "243 Bets", value: 24057, desc: "Max 5 triples" },
                  {
                    label: "1,024 Bets",
                    value: 101376,
                    desc: "Max 10 doubles",
                  },
                  {
                    label: "7,776 Bets",
                    value: 770424,
                    desc: "Theoretical max",
                  },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBudgetKsh(preset.value)}
                    className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                      budgetKsh === preset.value
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    title={preset.desc}
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatCurrency(preset.value)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {errors.budget && (
              <p className="text-red-600 text-sm mt-2">{errors.budget}</p>
            )}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">
                    Combinations:
                  </span>
                  <div className="text-2xl font-bold text-blue-700">
                    {calculateBudgetCombinations()}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-blue-900">
                    Cost per bet:
                  </span>
                  <div className="text-lg font-semibold text-blue-700">
                    {formatCurrency(SPORTPESA_RULES.costPerBet)}
                  </div>
                </div>
              </div>
            </div>

            {/* SportPesa Limits Info */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 text-sm mb-2">
                📋 SportPesa Mega Jackpot Pro Rules
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-yellow-700">
                <div className="bg-yellow-100 p-2 rounded">
                  <div className="font-medium mb-1">Doubles Only</div>
                  <div>Max 10 doubles</div>
                  <div className="text-yellow-600">= 1,024 combinations</div>
                  <div className="font-medium">Cost: KSh 101,376</div>
                </div>
                <div className="bg-yellow-100 p-2 rounded">
                  <div className="font-medium mb-1">Triples Only</div>
                  <div>Max 5 triples</div>
                  <div className="text-yellow-600">= 243 combinations</div>
                  <div className="font-medium">Cost: KSh 24,057</div>
                </div>
                <div className="bg-yellow-100 p-2 rounded">
                  <div className="font-medium mb-1">
                    Mixed (Theoretical Max)
                  </div>
                  <div>5 doubles + 5 triples</div>
                  <div className="text-yellow-600">= 7,776 combinations</div>
                  <div className="font-medium">Cost: KSh 770,424</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-yellow-600 italic">
                * All combinations at KSh 99 per bet as per SportPesa rules
              </div>
            </div>
          </div>
        )}

        {/* Interactive Method */}
        {selectedJackpot && creationMethod === "interactive" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Game Selections</h3>
              {validation && (
                <div className="text-sm">
                  {validation.is_valid ? (
                    <span className="text-green-600">
                      ✓ {validation.total_combinations} combinations -{" "}
                      {formatCurrency(validation.total_cost)}
                    </span>
                  ) : (
                    <span className="text-red-600">✗ Invalid selection</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from(
                { length: selectedJackpot.total_matches || 17 },
                (_, i) => {
                  const gameNumber = (i + 1).toString();
                  const selections = gameSelections[gameNumber] || ["1"];

                  return (
                    <div key={gameNumber} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700">
                          Game {gameNumber}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getGameBadgeColor(
                            gameNumber
                          )}`}
                        >
                          {getSelectionTypeName(selections.length)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(["1", "X", "2"] as GameSelection[]).map(
                          (selection) => (
                            <button
                              key={selection}
                              type="button"
                              onClick={() =>
                                toggleGameSelection(gameNumber, selection)
                              }
                              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${getGameSelectionColor(
                                gameNumber,
                                selection
                              )}`}
                            >
                              {selection === "1"
                                ? "Home"
                                : selection === "X"
                                ? "Draw"
                                : "Away"}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {errors.selections && (
              <p className="text-red-600 text-sm mt-2">{errors.selections}</p>
            )}

            {/* Rules Summary */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                SportPesa Rules
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • Maximum {SPORTPESA_RULES.maxOnlyDoubles} doubles (if no
                  triples)
                </li>
                <li>
                  • Maximum {SPORTPESA_RULES.maxOnlyTriples} triples (if no
                  doubles)
                </li>
                <li>
                  • When mixing: max {SPORTPESA_RULES.maxCombiningDoubles}{" "}
                  doubles + {SPORTPESA_RULES.maxCombiningTriples} triples
                </li>
                <li>
                  • Cost: {formatCurrency(SPORTPESA_RULES.costPerBet)} per
                  individual bet
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={Boolean(
              submitting ||
                !selectedJackpot ||
                (creationMethod === "interactive" &&
                  validation &&
                  !validation.is_valid)
            )}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg text-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Simulation...
              </span>
            ) : (
              `Create Simulation${
                validation && validation.is_valid
                  ? ` • ${formatCurrency(validation.total_cost)}`
                  : creationMethod === "budget" && selectedJackpot
                  ? ` • ${formatCurrency(budgetKsh)}`
                  : ""
              }`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewSimulationForm;
