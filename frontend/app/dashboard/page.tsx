"use client";

import { useMemo } from "react";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { useJackpots } from "@/lib/hooks/use-jackpots";
import { Simulation, Jackpot } from "@/lib/api/types";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const {
    simulations,
    isLoading: isSimulationsLoading,
    error,
  } = useSimulations({
    page: 1,
    pageSize: 100, // Get more simulations for better stats
    enablePolling: false, // Disable polling for dashboard
  });
  const { jackpots, loading: isJackpotsLoading } = useJackpots();

  const currentJackpot = useMemo(() => {
    const typedJackpots = jackpots as Jackpot[];
    if (!typedJackpots || typedJackpots.length === 0) return null;
    return typedJackpots.find((j) => j.status === "open") || typedJackpots[0];
  }, [jackpots]);

  const stats = useMemo(() => {
    if (!simulations) {
      return {
        totalBets: 0,
        completedBets: 0,
        runningBets: 0,
        totalSpent: 0,
        totalWon: 0,
        averageWinRate: 0,
        bestWinRate: 0,
        totalCombinations: 0,
        winningCombinations: 0,
        winningPercentage: 0,
        totalPayout: 0,
        netLoss: 0,
        netResult: 0,
        bestMatchCount: 0,
      };
    }

    // Debug logging
    console.log("Dashboard simulations data:", {
      count: simulations.length,
      completed: simulations.filter((s) => s.status === "completed").length,
      sample: simulations[0],
    });

    const completedBets = simulations.filter(
      (sim: Simulation) => sim.status === "completed"
    );
    const runningBets = simulations.filter(
      (sim: Simulation) => sim.status === "running" || sim.status === "pending"
    );

    // Helper function to safely convert to number
    const toNumber = (value: unknown): number => {
      if (value === null || value === undefined) return 0;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    const totalSpent = simulations.reduce(
      (sum: number, sim: Simulation) => sum + toNumber(sim.total_cost),
      0
    );
    const totalWon = completedBets.reduce(
      (sum: number, sim: Simulation) =>
        sum + toNumber(sim.basic_results?.total_payout),
      0
    );

    // Calculate simulation-level win rate (percentage of simulations that won something)
    const winningBetsCount = completedBets.reduce(
      (count: number, sim: Simulation) => {
        const payout = toNumber(sim.basic_results?.total_payout);
        return count + (payout > 0 ? 1 : 0);
      },
      0
    );
    const simulationWinRate =
      completedBets.length > 0
        ? (winningBetsCount / completedBets.length) * 100
        : 0;

    // Calculate net result (positive = profit, negative = loss)
    const netResult = totalWon - totalSpent;

    const finalStats = {
      totalBets: simulations.length,
      completedBets: completedBets.length,
      runningBets: runningBets.length,
      totalSpent,
      totalWon,
      averageWinRate: simulationWinRate, // Now using simulation-level win rate
      bestWinRate: simulationWinRate, // For now, same as average
      totalCombinations: completedBets.reduce(
        (sum: number, sim: Simulation) =>
          sum + toNumber(sim.effective_combinations),
        0
      ),
      winningCombinations: winningBetsCount, // This is clearer as winningBetsCount
      winningPercentage: simulationWinRate,
      totalPayout: totalWon,
      netLoss: Math.abs(netResult), // Always positive for display
      netResult: netResult, // Keep the actual result for logic
      bestMatchCount: completedBets.reduce(
        (max: number, sim: Simulation) =>
          Math.max(max, toNumber(sim.basic_results?.best_match_count)),
        0
      ),
    };

    console.log("Dashboard calculated stats:", {
      ...finalStats,
      winCalculation: `${winningBetsCount}/${
        completedBets.length
      } = ${simulationWinRate.toFixed(1)}%`,
      netCalculation: `${totalWon} - ${totalSpent} = ${netResult}`,
      isProfit: netResult >= 0,
    });
    return finalStats;
  }, [simulations]);

  const formatCurrency = (amount: number) => {
    // Handle NaN, null, undefined, and invalid numbers
    if (amount === null || amount === undefined || isNaN(amount)) {
      amount = 0;
    }
    return `KSh ${Math.round(amount).toLocaleString()}`;
  };

  const calculateJackpotOdds = () => {
    // SportPesa Mega Jackpot odds: 1 in 4,782,969 for 17 correct predictions
    const odds = 1 / 4782969;
    return (odds * 100).toFixed(7);
  };

  if (isSimulationsLoading || isJackpotsLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="text-red-600 text-sm">
            Error loading dashboard: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-lg leading-6 font-medium text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Welcome to your gambling awareness dashboard
        </p>
      </div>
      <div className="border-t border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="relative rounded-lg border-2 border-blue-500 bg-white px-8 py-6 shadow-md flex items-center space-x-4 hover:border-blue-600 hover:shadow-lg focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all duration-200">
              <div className="flex-shrink-0">
                <div className="bg-blue-50 rounded-lg p-3">
                  <svg
                    className="h-12 w-12 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href="/dashboard/simulations/new"
                  className="focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-xl font-semibold text-gray-900">
                    Create New Bet
                  </p>
                  <p className="text-base text-gray-600 mt-1">
                    {currentJackpot
                      ? `Place a bet on the current jackpot`
                      : "Run a new jackpot bet"}
                  </p>
                </a>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Stats Card - Bets */}
            <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Bets
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.totalBets}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-blue-100 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Completed:</span>
                    <span className="font-medium">{stats.completedBets}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 mt-1">
                    <span>Running:</span>
                    <span className="font-medium">{stats.runningBets}</span>
                  </div>
                  <a
                    href="/dashboard/simulations"
                    className="font-medium text-blue-700 hover:text-blue-900 block mt-2"
                  >
                    View all bets
                    {stats.runningBets > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {stats.runningBets} running
                      </span>
                    )}
                  </a>
                </div>
              </div>
            </div>

            {/* Stats Card - Current Jackpot */}
            <div className="bg-green-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Current Mega Jackpot
                      </dt>
                      <dd className="text-2xl sm:text-3xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                        {currentJackpot
                          ? formatCurrency(currentJackpot.current_amount)
                          : "Loading..."}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-green-100 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a
                    href="/dashboard/jackpots"
                    className="font-medium text-green-700 hover:text-green-900"
                  >
                    View jackpot details
                    {currentJackpot && (
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          currentJackpot.status === "open"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {currentJackpot.status === "open" ? "Active" : "Closed"}
                      </span>
                    )}
                  </a>
                </div>
              </div>
            </div>

            {/* Stats Card - Odds */}
            <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Winning Probability
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {calculateJackpotOdds()}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-purple-100 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a
                    href="/dashboard/simulations/new"
                    className="font-medium text-purple-700 hover:text-purple-900"
                  >
                    Run a new simulation
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Results Analysis Section */}
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Results Analysis
            </h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Combinations Tested
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {stats.totalCombinations.toLocaleString()}
                      </dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Winning Bets
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {stats.winningCombinations.toLocaleString()}
                      </dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Average Win Rate
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {stats.averageWinRate.toFixed(2)}%
                      </dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Amount Spent
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {formatCurrency(stats.totalSpent)}
                      </dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Amount Won
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {formatCurrency(stats.totalWon)}
                      </dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stats.netResult >= 0 ? "Net Profit" : "Net Loss"}
                      </dt>
                      <dd
                        className={`mt-1 text-3xl font-semibold ${
                          stats.netResult >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(stats.netLoss)}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
