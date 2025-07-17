import { BetSpecification, Game as APIGame } from "@/lib/api/types";
import countryEmoji from "country-emoji";

interface GameCombinationsVisualizationProps {
  specification: BetSpecification | null;
  jackpotName?: string;
  games?: APIGame[];
  actualResults?: string[];
}

// Helper function to get country code from country name
const getCountryFlag = (country: string): string => {
  return countryEmoji.flag(country) || "🏳️";
};

export function GameCombinationsVisualization({
  specification,
  jackpotName,
  games = [],
  actualResults = [],
}: GameCombinationsVisualizationProps) {
  if (!specification || !specification.game_selections) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Game Combinations
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            No game selection data available for this simulation.
          </p>
        </div>
      </div>
    );
  }

  const gameSelections = specification.game_selections;
  const totalGames = Object.keys(gameSelections).length;

  // Helper functions
  const getSelectionBadgeColor = (selections: string[]) => {
    switch (selections.length) {
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

  const getSelectionTypeName = (count: number) => {
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



  const getSelectionButtonColor = (selection: string) => {
    switch (selection) {
      case "1":
        return "bg-green-500 text-white";
      case "X":
        return "bg-yellow-500 text-white";
      case "2":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Statistics
  const singleCount = Object.values(gameSelections).filter(
    (selections) => selections.length === 1
  ).length;
  const doubleCount = Object.values(gameSelections).filter(
    (selections) => selections.length === 2
  ).length;
  const tripleCount = Object.values(gameSelections).filter(
    (selections) => selections.length === 3
  ).length;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">
          Game Combinations
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Visual representation of your selected predictions for{" "}
          {jackpotName || "this jackpot"}
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalGames}</div>
            <div className="text-sm text-gray-500">Total Games</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {singleCount}
            </div>
            <div className="text-sm text-gray-500">Singles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {doubleCount}
            </div>
            <div className="text-sm text-gray-500">Doubles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {tripleCount}
            </div>
            <div className="text-sm text-gray-500">Triples</div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="border-t border-gray-200 px-4 py-5">
        <div className="space-y-2">
          {Object.entries(gameSelections)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([gameNumber, selections]) => {
              const gameIndex = parseInt(gameNumber) - 1;
              const game = games[gameIndex];
              const actualResult = actualResults[gameIndex];
              const isCorrect =
                actualResult && selections.includes(actualResult);

              return (
                <div
                  key={gameNumber}
                  className="border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow bg-white flex flex-col sm:flex-row sm:items-center gap-2"
                >
                  {/* Game Number */}
                  <div className="w-12 text-center">
                    <div className="text-sm font-medium text-gray-700 flex items-center justify-center">
                      {gameNumber}
                      {actualResult && (
                        <span
                          className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs ${
                            isCorrect
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {isCorrect ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Teams Section with Date/Time Header */}
                  <div className="flex-1 min-w-[200px]">
                    {game && (
                      <>
                        {game.kick_off_time && (
                          <div className="text-sm text-gray-600 mb-1">
                            {new Date(game.kick_off_time).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                              }
                            )}{" "}
                            {new Date(game.kick_off_time).toLocaleDateString(
                              "en-US",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              }
                            )}{" "}
                            -{" "}
                            {new Date(game.kick_off_time).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              }
                            )}{" "}
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
                            {game.score_home !== undefined &&
                              game.score_away !== undefined && (
                                <div className="text-xs font-bold text-gray-900">
                                  Score: {game.score_home} - {game.score_away}
                                </div>
                              )}
                          </div>
                          {game.tournament && (
                            <div className="text-xs text-gray-500 truncate hidden sm:block">
                              {game.tournament}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Selections */}
                  <div className="flex gap-1 min-w-[180px]">
                    {selections.map((selection) => (
                      <div
                        key={selection}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${getSelectionButtonColor(
                          selection
                        )}`}
                      >
                        <div className="leading-none">
                          {selection === "1"
                            ? "HOME"
                            : selection === "X"
                            ? "DRAW"
                            : "AWAY"}
                        </div>
                        {game && (
                          <div className="mt-0.5 opacity-90">
                            {selection === "1" && game.odds_home
                              ? game.odds_home.toFixed(2)
                              : selection === "X" && game.odds_draw
                              ? game.odds_draw.toFixed(2)
                              : selection === "2" && game.odds_away
                              ? game.odds_away.toFixed(2)
                              : ""}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Selection Type Badge */}
                  <div className="w-16 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSelectionBadgeColor(
                        selections
                      )}`}
                    >
                      {getSelectionTypeName(selections.length)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Combination Summary */}
      <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-gray-700">
              Total Combinations:{" "}
              {specification.total_combinations.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              Combination Type:{" "}
              {specification.combination_type.charAt(0).toUpperCase() +
                specification.combination_type.slice(1)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              Total Cost: KSh {specification.total_cost.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              @ KSh 99 per combination
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
