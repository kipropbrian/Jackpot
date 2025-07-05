"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { useJackpots } from "@/lib/hooks/use-jackpots";
import { useJackpot } from "@/lib/hooks/use-jackpot";
import { useIsAdmin } from "@/lib/hooks/use-admin";
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
  const { simulations } = useSimulations({ enablePolling: false }); // Disable polling - only used for name generation
  const { jackpots, loading: jackpotsLoading } = useJackpots();
  const { isAdmin } = useIsAdmin();

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

  // Fetch detailed jackpot data when a jackpot is selected
  const { jackpot: jackpotDetails } = useJackpot(selectedJackpot?.id);

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

  // Check if current selections would be valid if we add this selection
  const wouldSelectionBeValid = useCallback(
    (gameNumber: string, selection: GameSelection): boolean => {
      if (!selectedJackpot || !validation) return true;

      // Create a test selection
      const currentSelections = gameSelections[gameNumber] || [];
      const newSelections = currentSelections.includes(selection)
        ? currentSelections.filter((s) => s !== selection)
        : [...currentSelections, selection].sort();

      // If removing would leave empty, always allow (we'll default to "1")
      if (newSelections.length === 0) return true;

      // Calculate how many doubles and triples we'd have
      const testGameSelections = {
        ...gameSelections,
        [gameNumber]: newSelections,
      };

      let doubleCount = 0;
      let tripleCount = 0;

      Object.values(testGameSelections).forEach((selections) => {
        if (selections.length === 2) doubleCount++;
        if (selections.length === 3) tripleCount++;
      });

      // Check SportPesa rules
      if (doubleCount > 0 && tripleCount > 0) {
        // Mixed mode
        return (
          doubleCount <= SPORTPESA_RULES.maxCombiningDoubles &&
          tripleCount <= SPORTPESA_RULES.maxCombiningTriples
        );
      } else if (doubleCount > 0) {
        // Doubles only
        return doubleCount <= SPORTPESA_RULES.maxOnlyDoubles;
      } else if (tripleCount > 0) {
        // Triples only
        return tripleCount <= SPORTPESA_RULES.maxOnlyTriples;
      }

      return true;
    },
    [selectedJackpot, gameSelections, validation]
  );

  const validateGameSelections = useCallback(async () => {
    if (!selectedJackpot) return;

    try {
      // Call validation API using the API client
      // Send jackpot_id as query parameter and game_selections in body
      const response = await apiClient.post(
        `${API_ENDPOINTS.VALIDATE_SELECTIONS}?jackpot_id=${selectedJackpot.id}`,
        {
          game_selections: gameSelections,
        }
      );

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

  // Random selection function
  const randomizeSelections = () => {
    if (!selectedJackpot) return;

    const newSelections: GameSelectionState = {};
    const gameCount = selectedJackpot.total_matches || 17;

    // Generate random valid selections
    for (let i = 1; i <= gameCount; i++) {
      const gameNumber = i.toString();
      const selectionOptions: GameSelection[] = ["1", "X", "2"];

      // Random number of selections (1-3)
      const numSelections = Math.floor(Math.random() * 3) + 1;

      // Random selections
      const selectedOptions: GameSelection[] = [];
      for (let j = 0; j < numSelections; j++) {
        const availableOptions = selectionOptions.filter(
          (opt) => !selectedOptions.includes(opt)
        );
        if (availableOptions.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * availableOptions.length
          );
          selectedOptions.push(availableOptions[randomIndex]);
        }
      }

      newSelections[gameNumber] = selectedOptions.sort();
    }

    // Check if the random selection is valid according to SportPesa rules
    let doubleCount = 0;
    let tripleCount = 0;

    Object.values(newSelections).forEach((selections) => {
      if (selections.length === 2) doubleCount++;
      if (selections.length === 3) tripleCount++;
    });

    // If it violates rules, simplify until valid
    if (
      doubleCount > SPORTPESA_RULES.maxOnlyDoubles ||
      tripleCount > SPORTPESA_RULES.maxOnlyTriples
    ) {
      // Convert all to singles
      for (let i = 1; i <= gameCount; i++) {
        const gameNumber = i.toString();
        const options: GameSelection[] = ["1", "X", "2"];
        newSelections[gameNumber] = [options[Math.floor(Math.random() * 3)]];
      }
    }

    setGameSelections(newSelections);
  };

  // Smart selection based on odds
  const smartSelections = () => {
    if (!selectedJackpot || !jackpotDetails?.games) return;

    const newSelections: GameSelectionState = {};
    const games = jackpotDetails.games;

    games.forEach((game, index) => {
      const gameNumber = (index + 1).toString();

      // Get odds or use defaults
      const homeOdds = game.odds_home || 2.0;
      const drawOdds = game.odds_draw || 3.0;
      const awayOdds = game.odds_away || 2.0;

      // Higher odds = less likely = more selections for diversification
      // Lower odds = more likely = fewer selections (focus on likely outcome)

      const minOdds = Math.min(homeOdds, drawOdds, awayOdds);
      const maxOdds = Math.max(homeOdds, drawOdds, awayOdds);

      let selections: GameSelection[] = [];

      if (minOdds > 2.5) {
        // All odds are high, pick all options (triple)
        selections = ["1", "X", "2"];
      } else if (maxOdds > 3.0) {
        // Mixed odds, pick the two most likely (lowest odds)
        const oddsArray = [
          { selection: "1" as GameSelection, odds: homeOdds },
          { selection: "X" as GameSelection, odds: drawOdds },
          { selection: "2" as GameSelection, odds: awayOdds },
        ];
        oddsArray.sort((a, b) => a.odds - b.odds);
        selections = [oddsArray[0].selection, oddsArray[1].selection].sort();
      } else {
        // One clear favorite, pick the most likely (lowest odds)
        if (homeOdds <= drawOdds && homeOdds <= awayOdds) {
          selections = ["1"];
        } else if (drawOdds <= homeOdds && drawOdds <= awayOdds) {
          selections = ["X"];
        } else {
          selections = ["2"];
        }
      }

      newSelections[gameNumber] = selections;
    });

    // Validate against SportPesa rules and adjust if necessary
    let doubleCount = 0;
    let tripleCount = 0;

    Object.values(newSelections).forEach((selections) => {
      if (selections.length === 2) doubleCount++;
      if (selections.length === 3) tripleCount++;
    });

    // If it violates rules, simplify the games with highest odds (most uncertain)
    if (
      doubleCount > SPORTPESA_RULES.maxCombiningDoubles ||
      tripleCount > SPORTPESA_RULES.maxCombiningTriples
    ) {
      const gamesWithMultipleSelections = Object.entries(newSelections)
        .filter(([, selections]) => selections.length > 1)
        .map(([gameNumber, selections]) => {
          const gameIndex = parseInt(gameNumber) - 1;
          const game = games[gameIndex];
          const avgOdds =
            ((game?.odds_home || 2) +
              (game?.odds_draw || 3) +
              (game?.odds_away || 2)) /
            3;
          return { gameNumber, selections, avgOdds };
        })
        .sort((a, b) => b.avgOdds - a.avgOdds); // Highest odds first

      // Simplify games starting with highest odds until rules are satisfied
      let adjustedDoubles = doubleCount;
      let adjustedTriples = tripleCount;

      for (const gameInfo of gamesWithMultipleSelections) {
        if (
          adjustedDoubles <= SPORTPESA_RULES.maxCombiningDoubles &&
          adjustedTriples <= SPORTPESA_RULES.maxCombiningTriples
        ) {
          break;
        }

        if (gameInfo.selections.length === 3) {
          // Convert triple to single (pick most likely)
          const gameIndex = parseInt(gameInfo.gameNumber) - 1;
          const game = games[gameIndex];
          if (game) {
            const homeOdds = game.odds_home || 2.0;
            const drawOdds = game.odds_draw || 3.0;
            const awayOdds = game.odds_away || 2.0;

            let bestSelection: GameSelection = "1";
            if (drawOdds <= homeOdds && drawOdds <= awayOdds) {
              bestSelection = "X";
            } else if (awayOdds <= homeOdds && awayOdds <= drawOdds) {
              bestSelection = "2";
            }

            newSelections[gameInfo.gameNumber] = [bestSelection];
            adjustedTriples--;
          }
        } else if (gameInfo.selections.length === 2) {
          // Convert double to single
          const gameIndex = parseInt(gameInfo.gameNumber) - 1;
          const game = games[gameIndex];
          if (game) {
            const homeOdds = game.odds_home || 2.0;
            const drawOdds = game.odds_draw || 3.0;
            const awayOdds = game.odds_away || 2.0;

            let bestSelection: GameSelection = "1";
            if (drawOdds <= homeOdds && drawOdds <= awayOdds) {
              bestSelection = "X";
            } else if (awayOdds <= homeOdds && awayOdds <= drawOdds) {
              bestSelection = "2";
            }

            newSelections[gameInfo.gameNumber] = [bestSelection];
            adjustedDoubles--;
          }
        }
      }
    }

    setGameSelections(newSelections);
  };

  const getGameSelectionColor = (
    gameNumber: string,
    selection: GameSelection
  ): string => {
    const currentSelections = gameSelections[gameNumber] || [];
    const isSelected = currentSelections.includes(selection);
    const wouldBeValid = wouldSelectionBeValid(gameNumber, selection);

    if (isSelected) {
      if (currentSelections.length === 1) return "bg-blue-500 text-white"; // Single
      if (currentSelections.length === 2) return "bg-purple-500 text-white"; // Double
      if (currentSelections.length === 3) return "bg-orange-500 text-white"; // Triple
    }

    if (!wouldBeValid) {
      return "bg-red-100 text-red-400 cursor-not-allowed";
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
      if (onSubmit && selectedJackpot) {
        const simulationName = generateSimulationName(
          selectedJackpot,
          creationMethod
        );

        const createData: SimulationCreate = {
          name: simulationName,
          jackpot_id: selectedJackpot.id,
        };

        if (creationMethod === "budget") {
          createData.budget_ksh = budgetKsh;
        } else {
          createData.game_selections = gameSelections;
        }

        await onSubmit(createData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
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
        newErrors.budget = `Minimum budget is ${formatCurrency(
          SPORTPESA_RULES.costPerBet
        )}`;
      }
    } else if (creationMethod === "interactive") {
      if (validation && !validation.is_valid) {
        newErrors.selections = "Please fix the game selections";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrency = (amount: number): string => {
    return `KSh ${amount.toLocaleString()}`;
  };

  // Get games data from detailed jackpot
  const games = jackpotDetails?.games || [];

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Create New Bet</h2>
        <p className="text-blue-100 mt-2">Create a bet using SportPesa rules</p>
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
              {jackpots.map((jackpot) => (
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
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        jackpot.status === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {jackpot.status === "open" ? "Active" : "Completed"}
                      {jackpot.status === "completed" && isAdmin && " (Admin)"}
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
              jackpots.filter((j) => j.status === "open" || isAdmin).length ===
                0) && (
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

        {/* Admin Notice for Completed Jackpots */}
        {selectedJackpot &&
          selectedJackpot.status === "completed" &&
          isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Admin Notice: Completed Jackpot
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      You are creating a simulation for a completed jackpot. The
                      simulation will run immediately since all game results are
                      already available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            {/* Header with validation status and action buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 text-lg">
                  Game Selections
                </h3>
                {validation && (
                  <div className="text-sm mt-1">
                    {validation.is_valid ? (
                      <span className="text-green-600 font-medium">
                        ✓ {validation.total_combinations} combinations -{" "}
                        {formatCurrency(validation.total_cost)}
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        ✗ Invalid selection - Please adjust your picks
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={randomizeSelections}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
                  title="Generate random valid selections"
                >
                  🎲 Random
                </button>
                <button
                  type="button"
                  onClick={smartSelections}
                  disabled={!jackpotDetails?.games}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                  title="Auto-select based on odds (lower odds = more likely)"
                >
                  🧠 Smart
                </button>
              </div>
            </div>

            {/* Game Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from(
                { length: selectedJackpot.total_matches || 17 },
                (_, i) => {
                  const gameNumber = (i + 1).toString();
                  const selections = gameSelections[gameNumber] || ["1"];
                  const game = games[i]; // Get corresponding game data

                  return (
                    <div
                      key={gameNumber}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      {/* Game Header */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700 text-sm">
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

                      {/* Teams and Tournament Info */}
                      {game && (
                        <div className="mb-3 space-y-1">
                          <div className="text-sm">
                            <div
                              className="font-medium text-blue-600 truncate"
                              title={game.home_team}
                            >
                              🏠 {game.home_team || "Home Team"}
                            </div>
                            <div
                              className="font-medium text-red-600 truncate"
                              title={game.away_team}
                            >
                              ✈️ {game.away_team || "Away Team"}
                            </div>
                          </div>
                          {(game.tournament || game.country) && (
                            <div className="text-xs text-gray-500 truncate">
                              {game.country}{" "}
                              {game.tournament && `• ${game.tournament}`}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selection Buttons with Odds */}
                      <div className="grid grid-cols-3 gap-2">
                        {(["1", "X", "2"] as GameSelection[]).map(
                          (selection) => {
                            const isValidSelection = wouldSelectionBeValid(
                              gameNumber,
                              selection
                            );
                            const odds = game
                              ? selection === "1"
                                ? game.odds_home
                                : selection === "X"
                                ? game.odds_draw
                                : game.odds_away
                              : null;

                            return (
                              <button
                                key={selection}
                                type="button"
                                onClick={() =>
                                  isValidSelection &&
                                  toggleGameSelection(gameNumber, selection)
                                }
                                disabled={!isValidSelection}
                                className={`px-2 py-3 rounded text-sm font-medium transition-colors ${getGameSelectionColor(
                                  gameNumber,
                                  selection
                                )}`}
                                title={
                                  !isValidSelection
                                    ? "This selection would violate SportPesa rules"
                                    : undefined
                                }
                              >
                                <div className="text-xs leading-tight">
                                  {selection === "1"
                                    ? "Home"
                                    : selection === "X"
                                    ? "Draw"
                                    : "Away"}
                                </div>
                                {odds && (
                                  <div className="text-xs mt-1 opacity-90">
                                    {odds.toFixed(2)}
                                  </div>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* Kickoff Time */}
                      {game?.kick_off_time && (
                        <div className="text-xs text-gray-500 mt-2 text-center">
                          {new Date(game.kick_off_time).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* Loading state for games */}
            {selectedJackpot && !jackpotDetails && (
              <div className="text-center py-4 text-gray-500">
                <div className="animate-pulse">Loading game details...</div>
              </div>
            )}

            {errors.selections && (
              <p className="text-red-600 text-sm mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                {errors.selections}
              </p>
            )}

            {/* Enhanced Rules Summary */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                SportPesa Mega Jackpot Rules & Tips
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">
                    Selection Rules:
                  </h5>
                  <ul className="text-blue-600 space-y-1">
                    <li>
                      • Max {SPORTPESA_RULES.maxOnlyDoubles} doubles (if no
                      triples)
                    </li>
                    <li>
                      • Max {SPORTPESA_RULES.maxOnlyTriples} triples (if no
                      doubles)
                    </li>
                    <li>
                      • Mixed: max {SPORTPESA_RULES.maxCombiningDoubles} doubles
                      + {SPORTPESA_RULES.maxCombiningTriples} triples
                    </li>
                    <li>
                      • Cost: {formatCurrency(SPORTPESA_RULES.costPerBet)} per
                      bet
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Pro Tips:</h5>
                  <ul className="text-blue-600 space-y-1">
                    <li>
                      • <strong>Smart button:</strong> Picks based on odds
                    </li>
                    <li>
                      • <strong>Random button:</strong> Generates valid
                      selections
                    </li>
                    <li>
                      • <strong>Lower odds</strong> = more likely outcome
                    </li>
                    <li>
                      • <strong>Red buttons</strong> = violate rules (disabled)
                    </li>
                  </ul>
                </div>
              </div>
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
                Creating Bet...
              </span>
            ) : (
              `Create Bet${
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
