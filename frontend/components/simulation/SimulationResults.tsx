import { Simulation, Jackpot } from "@/lib/api/types";

interface SimulationResultsProps {
  simulation: Simulation;
  jackpot?: Jackpot | null;
}

export default function SimulationResults({
  simulation,
  jackpot,
}: SimulationResultsProps) {
  if (!simulation.results) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Results Analysis
        </h2>
        <p className="text-gray-500">No results available yet.</p>
      </div>
    );
  }

  const results = simulation.results;
  const analysis = results.analysis;

  const formatCurrency = (amount: number, currency = "KSh") => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(4)}%`;
  };

  // Calculate correct gambling logic
  const bestMatchCount = results.best_match_count;
  const totalCombinations = analysis.total_combinations;

  // In jackpot betting, you only get paid for your highest match
  // Find how many combinations achieved the best match
  const bestMatchWinners =
    results.prize_level_wins[bestMatchCount.toString()] || 0;

  // Get the actual payout for the best match from jackpot metadata or fallback to results
  let actualTotalPayout = 0;
  let payoutPerWinner = 0;

  if (bestMatchCount > 0 && bestMatchWinners > 0) {
    const prizeKey = `${bestMatchCount}/${bestMatchCount}`;
    if (jackpot?.metadata?.prizes?.[prizeKey]) {
      // Use the actual jackpot prize amount
      payoutPerWinner = jackpot.metadata.prizes[prizeKey];
      actualTotalPayout = payoutPerWinner; // You only win once, regardless of combinations
    } else {
      // Fallback to the calculated payout from results
      payoutPerWinner =
        results.prize_level_payouts[bestMatchCount.toString()] || 0;
      actualTotalPayout = payoutPerWinner;
    }
  }

  const actualNetResult = actualTotalPayout - simulation.total_cost;

  // Build complete prize structure for display
  const allPrizeLevels = [];
  if (jackpot?.metadata?.prizes) {
    const totalGames = analysis.actual_results.length;

    // Start from the minimum prize level up to total games
    for (let level = 13; level <= totalGames; level++) {
      const prizeKey = `${level}/${level}`;
      const prizeAmount = jackpot.metadata.prizes[prizeKey] || 0;
      const combinationsAtLevel =
        results.prize_level_wins[level.toString()] || 0;
      const isWon = level === bestMatchCount && combinationsAtLevel > 0;

      allPrizeLevels.push({
        level: `${level}/${totalGames}`, // Display as level/totalGames for clarity
        matches_required: level,
        prize_amount: prizeAmount,
        winning_combinations: combinationsAtLevel,
        is_won: isWon,
        total_payout: isWon ? actualTotalPayout : 0,
        payout_per_winner: isWon ? payoutPerWinner : prizeAmount,
      });
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">
          Results Analysis
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Analysis based on jackpot betting rules - you are paid for your
          highest match only
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        {/* Overall Summary */}
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Overall Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm font-medium text-gray-500">
                Total Combinations
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCombinations.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm font-medium text-gray-500">
                Best Match Combinations
              </p>
              <p className="text-2xl font-bold text-green-600">
                {bestMatchWinners.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm font-medium text-gray-500">
                Best Match Success Rate
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatPercentage((bestMatchWinners / totalCombinations) * 100)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm font-medium text-gray-500">Best Match</p>
              <p className="text-2xl font-bold text-purple-600">
                {bestMatchCount} games
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="px-4 py-4 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Financial Summary
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-blue-700">
                Total Investment
              </dt>
              <dd className="text-xl font-bold text-blue-900">
                {formatCurrency(simulation.total_cost)}
              </dd>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-green-700">
                Total Payout
              </dt>
              <dd className="text-xl font-bold text-green-900">
                {formatCurrency(actualTotalPayout)}
              </dd>
            </div>
            <div
              className={`p-4 rounded-lg ${
                actualNetResult > 0
                  ? "bg-green-50"
                  : actualNetResult === 0
                  ? "bg-gray-50"
                  : "bg-red-50"
              }`}
            >
              <dt
                className={`text-sm font-medium ${
                  actualNetResult > 0
                    ? "text-green-700"
                    : actualNetResult === 0
                    ? "text-gray-700"
                    : "text-red-700"
                }`}
              >
                Net{" "}
                {actualNetResult > 0
                  ? "Profit"
                  : actualNetResult === 0
                  ? "Result"
                  : "Loss"}
              </dt>
              <dd
                className={`text-xl font-bold ${
                  actualNetResult > 0
                    ? "text-green-900"
                    : actualNetResult === 0
                    ? "text-gray-900"
                    : "text-red-900"
                }`}
              >
                {formatCurrency(Math.abs(actualNetResult))}
              </dd>
            </div>
          </dl>
        </div>

        {/* Prize Level Breakdown */}
        {allPrizeLevels.length > 0 ? (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Prize Level Breakdown
            </h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prize Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prize Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Combinations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allPrizeLevels
                    .sort((a, b) => b.matches_required - a.matches_required)
                    .map((prize, index) => (
                      <tr
                        key={prize.level}
                        className={`${
                          prize.is_won
                            ? "bg-green-50 border-l-4 border-green-400"
                            : index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {prize.level}
                          {prize.is_won && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              WON
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">
                            {formatCurrency(prize.prize_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prize.winning_combinations.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prize.is_won ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(prize.total_payout)} earned
                            </span>
                          ) : prize.winning_combinations > 0 ? (
                            <span className="text-gray-500">
                              Not highest match
                            </span>
                          ) : (
                            <span className="text-gray-400">No matches</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {bestMatchCount > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Jackpot Betting Rules:</strong> You are paid only for
                  your highest match ({bestMatchCount} games). Even if you had
                  combinations that matched {bestMatchCount - 1} or fewer games,
                  those don&apos;t contribute to your payout since you achieved
                  a higher match.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Fallback to original breakdown if no jackpot metadata
          analysis.prize_breakdown &&
          analysis.prize_breakdown.length > 0 && (
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Prize Level Breakdown
              </h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prize Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Winning Combinations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payout per Winner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Payout
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysis.prize_breakdown.map((prize, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {prize.level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prize.winning_combinations.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(prize.payout_per_winner)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(prize.total_payout)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Combination Details */}
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Combination Details
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Combination Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {analysis.combination_type}
                {analysis.combination_type === "mixed" && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({simulation.double_count} doubles,{" "}
                    {simulation.triple_count} triples)
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Effective Combinations
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {simulation.effective_combinations.toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actual Results */}
        {analysis.actual_results && (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Actual Game Results
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.actual_results.map((result: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  Game {index + 1}:
                  <span
                    className={`ml-1 font-bold ${
                      result === "1"
                        ? "text-blue-600"
                        : result === "X"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {result === "1" ? "Home" : result === "X" ? "Draw" : "Away"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
