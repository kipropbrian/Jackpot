"use client";
import React, { useState, useEffect, useCallback } from "react";
import CreationMethodToggle from "@/components/simulation/creation-method-toggle";
import BudgetSection from "@/components/simulation/budget-section";
import { useLatestJackpot } from "@/lib/hooks/use-jackpots";
import {
  Jackpot,
  SimulationCreate,
  GameSelectionValidation,
} from "@/lib/api/types";
import { validateGameSelections, SPORTPESA_RULES } from "@/lib/utils";
import countryEmoji from "country-emoji";

// Helper function to get country code from country name
const getCountryFlag = (country: string): string => {
  return countryEmoji.flag(country) || "🏳️";
};

export interface NewSimulationFormProps {
  onSubmit?: (values: SimulationCreate) => void;
}

type CreationMethod = "budget" | "interactive";
type GameSelection = "1" | "X" | "2";

interface GameSelectionState {
  [gameNumber: string]: GameSelection[];
}

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
  // Use the latest jackpot hook instead of jackpots list
  const { jackpot: latestJackpot, loading: jackpotLoading } =
    useLatestJackpot();

  // Form state
  const [selectedJackpot, setSelectedJackpot] = useState<Jackpot | null>(null);
  const [creationMethod, setCreationMethod] =
    useState<CreationMethod>("interactive");
  const [budgetKsh, setBudgetKsh] = useState<number>(500);
  const [gameSelections, setGameSelections] = useState<GameSelectionState>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation state
  const [validation, setValidation] = useState<GameSelectionValidation | null>(
    null
  );

  // Auto-select the latest jackpot when loaded
  useEffect(() => {
    if (!jackpotLoading && latestJackpot && !selectedJackpot) {
      setSelectedJackpot(latestJackpot);
    }
  }, [jackpotLoading, latestJackpot, selectedJackpot]);

  // Auto-generate simulation name based on selections
  const generateSimulationName = (
    jackpot: Jackpot | null,
    combinations: number
  ): string => {
    if (!jackpot) return "";

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
    // Simplified name generation without depending on simulations list
    const shortId = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    const combinationsShort =
      combinations >= 1000
        ? `${combinations / 1000}K`
        : combinations.toString();

    return `SIM${shortId}-${dateStr}-MEGA-${combinationsShort}`;
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

      const testValidation = validateGameSelections(testGameSelections);
      return testValidation.is_valid;
    },
    [selectedJackpot, gameSelections, validation]
  );

  // Validate game selections locally
  const validateSelections = useCallback(() => {
    if (!selectedJackpot || Object.keys(gameSelections).length === 0) {
      setValidation(null);
      return;
    }

    const result = validateGameSelections(gameSelections);
    setValidation(result);
  }, [selectedJackpot, gameSelections]);

  // Trigger validation when selections change
  useEffect(() => {
    if (creationMethod === "interactive" && selectedJackpot) {
      validateSelections();
    }
  }, [gameSelections, selectedJackpot, creationMethod, validateSelections]);

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
    if (!selectedJackpot || !latestJackpot?.games) return;

    const newSelections: GameSelectionState = {};
    const games = latestJackpot.games;

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
          validation?.total_combinations || 0
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

  // Get games data directly from the selected jackpot
  const games = selectedJackpot?.games || [];

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Create New Bet</h2>
        <p className="text-blue-100 mt-2">Create a bet using SportPesa rules</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* --- Refactored creation method toggle --- */}
        {selectedJackpot && (
          <CreationMethodToggle
            creationMethod={creationMethod}
            onChange={setCreationMethod}
          />
        )}

        {/* --- Refactored budget section --- */}
        {selectedJackpot && creationMethod === "budget" && (
          <BudgetSection
            budgetKsh={budgetKsh}
            setBudgetKsh={setBudgetKsh}
            errors={errors}
            calculateCombinations={calculateBudgetCombinations}
            formatCurrency={formatCurrency}
            RULES={SPORTPESA_RULES}
          />
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
                  disabled={!latestJackpot?.games}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                  title="Auto-select based on odds (lower odds = more likely)"
                >
                  🧠 Smart
                </button>
              </div>
            </div>

            {/* Game Cards Grid */}
            <div className="space-y-2">
              {Array.from(
                { length: selectedJackpot.total_matches || 17 },
                (_, i) => {
                  const gameNumber = (i + 1).toString();
                  const selections = gameSelections[gameNumber] || ["1"];
                  const game = games[i]; // Get corresponding game data

                  return (
                    <div
                      key={gameNumber}
                      className="border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow bg-white flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      {/* Game Number */}
                      <div className="w-12 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {gameNumber}
                        </span>
                      </div>

                      {/* Teams Section with Date/Time Header */}
                      <div className="flex-1 min-w-[200px]">
                        {game && (
                          <>
                            {game.kick_off_time && (
                              <div className="text-sm text-gray-600 mb-1">
                                {new Date(
                                  game.kick_off_time
                                ).toLocaleDateString("en-US", {
                                  weekday: "long",
                                })}{" "}
                                {new Date(
                                  game.kick_off_time
                                ).toLocaleDateString("en-US", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(
                                  game.kick_off_time
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}{" "}
                                |{" "}
                                {game.country && (
                                  <span
                                    className="text-base"
                                    role="img"
                                    aria-label={`${game.country} flag`}
                                  >
                                    {getCountryFlag(game.country)}
                                  </span>
                                )}{" "}
                                {game.country}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div
                                  className="text-sm font-medium text-blue-600 truncate"
                                  title={game.home_team}
                                >
                                  {game.home_team || "Home Team"}
                                </div>
                                <div
                                  className="text-sm font-medium text-red-600 truncate"
                                  title={game.away_team}
                                >
                                  {game.away_team || "Away Team"}
                                </div>
                              </div>
                              {(game.tournament || game.country) && (
                                <div className="text-xs text-gray-500 truncate hidden sm:block">
                                  {game.tournament}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Selection Buttons */}
                      <div className="flex gap-1 min-w-[180px]">
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
                                className={`flex-1 px-2 py-1.5 rounded text-sm font-medium transition-colors ${getGameSelectionColor(
                                  gameNumber,
                                  selection
                                )}`}
                                title={
                                  !isValidSelection
                                    ? "This selection would violate SportPesa rules"
                                    : undefined
                                }
                              >
                                <div className="text-xs leading-none">
                                  {selection === "1"
                                    ? "HOME"
                                    : selection === "X"
                                    ? "DRAW"
                                    : "AWAY"}
                                </div>
                                {odds && (
                                  <div className="text-xs mt-0.5 opacity-90">
                                    {odds.toFixed(2)}
                                  </div>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* Selection Type Badge */}
                      <div className="w-16 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${getGameBadgeColor(
                            gameNumber
                          )}`}
                        >
                          {getSelectionTypeName(selections.length)}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Loading state for games */}
            {selectedJackpot && !latestJackpot && (
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
