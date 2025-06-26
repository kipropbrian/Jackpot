"use client";

import { useMemo } from "react";
import { useSimulations } from "@/lib/hooks/use-simulations";
import { useJackpots } from "@/lib/hooks/use-jackpots";

export default function DashboardPage() {
  const { simulations, isLoading: isSimulationsLoading } = useSimulations();
  const { jackpots, loading: isJackpotsLoading } = useJackpots();

  const currentJackpot = useMemo(() => {
    if (!jackpots || jackpots.length === 0) return null;

    // First, try to find an active jackpot (status: "open")
    const activeJackpot = jackpots.find((jackpot) => jackpot.status === "open");
    if (activeJackpot) return activeJackpot;

    // If no active jackpot, return the latest one (most recent scraped_at)
    return jackpots.reduce((latest, current) => {
      const latestDate = new Date(latest.scraped_at);
      const currentDate = new Date(current.scraped_at);
      return currentDate > latestDate ? current : latest;
    });
  }, [jackpots]);

  const stats = useMemo(() => {
    if (!simulations) {
      return {
        totalSimulations: 0,
        completedSimulations: 0,
        runningSimulations: 0,
        totalSpent: 0,
        totalWon: 0,
        averageWinRate: 0,
        bestWinRate: 0,
        totalCombinations: 0,
        winningCombinations: 0,
        winningPercentage: 0,
        totalPayout: 0,
        netLoss: 0,
        bestMatchCount: 0,
      };
    }

    const completedSims = simulations.filter(
      (sim) => sim.status === "completed"
    );
    const runningSims = simulations.filter(
      (sim) => sim.status === "running" || sim.status === "pending"
    );
    const totalSpent = simulations.reduce(
      (sum, sim) => sum + (sim.total_cost || 0),
      0
    );
    const totalWon = completedSims.reduce(
      (sum, sim) => sum + (sim.results?.total_payout || 0),
      0
    );
    const winRates = completedSims.map(
      (sim) => sim.results?.winning_percentage || 0
    );

    return {
      totalSimulations: simulations.length,
      completedSimulations: completedSims.length,
      runningSimulations: runningSims.length,
      totalSpent,
      totalWon,
      averageWinRate: winRates.length
        ? winRates.reduce((a, b) => a + b, 0) / winRates.length
        : 0,
      bestWinRate: winRates.length ? Math.max(...winRates) : 0,
      totalCombinations: completedSims.reduce(
        (sum, sim) => sum + (sim.total_combinations || 0),
        0
      ),
      winningCombinations: completedSims.reduce(
        (sum, sim) => sum + (sim.results?.total_winning_combinations || 0),
        0
      ),
      winningPercentage: completedSims.length
        ? completedSims.reduce(
            (sum, sim) => sum + (sim.results?.winning_percentage || 0),
            0
          ) / completedSims.length
        : 0,
      totalPayout: totalWon,
      netLoss: totalSpent - totalWon,
      bestMatchCount: completedSims.reduce(
        (max, sim) => Math.max(max, sim.results?.best_match_count || 0),
        0
      ),
    };
  }, [simulations]);

  const formatCurrency = (amount: number) => {
    return `KSh ${Math.round(amount).toLocaleString()}`;
  };

  const calculateJackpotOdds = () => {
    // SportPesa Mega Jackpot odds: 1 in 4,782,969 for 17 correct predictions
    const odds = 1 / 4782969;
    return (odds * 100).toFixed(7);
  };

  if (isSimulationsLoading || isJackpotsLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="text-gray-900 text-sm">Loading dashboard...</div>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Stats Card - Simulations */}
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
                        Total Simulations
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.totalSimulations}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-blue-100 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a
                    href="/dashboard/simulations"
                    className="font-medium text-blue-700 hover:text-blue-900"
                  >
                    View all simulations
                    {stats.runningSimulations > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {stats.runningSimulations} running
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
                        Winning Combinations
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
                        Net Loss
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-600">
                        {formatCurrency(stats.netLoss)}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <div className="flex-shrink-0">
                  <svg
                    className="h-10 w-10 text-blue-600"
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
                <div className="flex-1 min-w-0">
                  <a
                    href="/dashboard/simulations/new"
                    className="focus:outline-none"
                  >
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">
                      Create New Simulation
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentJackpot
                        ? `Simulate the ${currentJackpot.name} jackpot`
                        : "Run a new jackpot simulation"}
                    </p>
                  </a>
                </div>
              </div>

              <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                <div className="flex-shrink-0">
                  <svg
                    className="h-10 w-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <a href="/dashboard/jackpots" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">
                      View Current Jackpots
                    </p>
                    <p className="text-sm text-gray-500">
                      See all available jackpots and their details
                    </p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
