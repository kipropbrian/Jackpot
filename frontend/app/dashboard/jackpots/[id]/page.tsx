"use client";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import { useJackpot } from "@/lib/hooks/use-jackpot";
import type { Game } from "@/lib/api/types";
import AdminJackpotGuard from "@/components/admin/admin-jackpot-guard";

const SingleJackpotPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const { jackpot, loading, error } = useJackpot(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !jackpot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-xl font-semibold mb-4">
              {error ?? "Jackpot not found"}
            </div>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              ← Back to Jackpots
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currency = jackpot.metadata?.currency || "KSH";
  const isCompleted = jackpot.status === "completed";
  const games = jackpot.games || [];
  const completedGamesCount = games.filter(
    (game) =>
      game.score_home !== null &&
      game.score_home !== undefined &&
      game.score_away !== null &&
      game.score_away !== undefined
  ).length;
  const progressPercentage =
    (completedGamesCount / jackpot.total_matches) * 100;

  const formatCurrency = (amount: number) => {
    // Round up to remove cents
    const roundedAmount = Math.ceil(amount);
    return `${currency} ${roundedAmount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGameResultIcon = (game: Game) => {
    if (
      game.score_home === null ||
      game.score_home === undefined ||
      game.score_away === null ||
      game.score_away === undefined
    ) {
      return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }

    if (game.score_home > game.score_away) {
      return (
        <div
          className="w-3 h-3 bg-blue-500 rounded-full"
          title="Home Win"
        ></div>
      );
    } else if (game.score_away > game.score_home) {
      return (
        <div className="w-3 h-3 bg-red-500 rounded-full" title="Away Win"></div>
      );
    } else {
      return (
        <div className="w-3 h-3 bg-yellow-500 rounded-full" title="Draw"></div>
      );
    }
  };

  const getBettingStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig = {
      OPEN: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
      },
      CLOSED: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
      },
      SUSPENDED: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-200",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
      >
        {status}
      </span>
    );
  };

  return (
    <AdminJackpotGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2 font-medium transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Jackpots
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {jackpot.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Scraped: {formatDate(jackpot.scraped_at)}</span>
                  {jackpot.completed_at && (
                    <span>Completed: {formatDate(jackpot.completed_at)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    isCompleted
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isCompleted ? "✓ Completed" : "⏳ In Progress"}
                </div>
                {jackpot.metadata?.betting_status &&
                  getBettingStatusBadge(jackpot.metadata.betting_status)}
              </div>
            </div>
          </div>

          {/* Main Prize & Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Jackpot Prize */}
            <div className="lg:col-span-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2 opacity-90">
                    Main Jackpot Prize
                  </h2>
                  <div className="text-5xl font-bold mb-4 whitespace-nowrap">
                    {formatCurrency(jackpot.current_amount)}
                  </div>
                  <div className="text-green-100">
                    {jackpot.total_matches} matches required
                  </div>
                </div>
                <div className="text-6xl opacity-20">🏆</div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Match Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Games Completed</span>
                    <span>
                      {completedGamesCount} / {jackpot.total_matches}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isCompleted ? "bg-green-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-center">
                  {Math.round(progressPercentage)}%
                </div>
              </div>
            </div>
          </div>

          {/* Prize Tiers */}
          {jackpot.metadata?.prizes &&
            Object.keys(jackpot.metadata.prizes).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Prize Tiers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(jackpot.metadata.prizes)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([tier, prize]) => {
                      const betAmount = jackpot.metadata?.bet_amounts?.[tier];
                      const isMainPrize = tier === "17/17";

                      return (
                        <div
                          key={tier}
                          className={`p-4 rounded-xl border-2 transition ${
                            isMainPrize
                              ? "border-green-200 bg-green-50"
                              : "border-gray-200 bg-gray-50 hover:border-blue-200"
                          }`}
                        >
                          <div
                            className={`text-sm font-medium mb-1 ${
                              isMainPrize ? "text-green-700" : "text-gray-600"
                            }`}
                          >
                            {tier} Matches {isMainPrize && "👑"}
                          </div>
                          <div
                            className={`text-lg font-bold mb-1 whitespace-nowrap ${
                              isMainPrize ? "text-green-800" : "text-gray-900"
                            }`}
                          >
                            {formatCurrency(prize)}
                          </div>
                          {betAmount && (
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              Bet: {formatCurrency(betAmount)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          {/* Games Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">
                Match Fixtures & Results
              </h3>
              <p className="text-gray-600 mt-1">
                {completedGamesCount} of {jackpot.total_matches} matches
                completed
              </p>
            </div>

            {games.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No games available for this jackpot.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kickoff
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Home
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Draw
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Away
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {games.map((game: Game, index: number) => {
                      const hasScores =
                        game.score_home !== null &&
                        game.score_home !== undefined &&
                        game.score_away !== null &&
                        game.score_away !== undefined;
                      const homeWon =
                        hasScores &&
                        (game.score_home ?? 0) > (game.score_away ?? 0);
                      const awayWon =
                        hasScores &&
                        (game.score_away ?? 0) > (game.score_home ?? 0);
                      const isDraw =
                        hasScores &&
                        (game.score_home ?? 0) === (game.score_away ?? 0);

                      // Alternating background colors for each game (both rows)
                      const isEvenGame = index % 2 === 0;
                      const gameRowClass = isEvenGame
                        ? "bg-white"
                        : "bg-gray-50";
                      const hoverClass = isEvenGame
                        ? "hover:bg-gray-50"
                        : "hover:bg-gray-100";

                      return (
                        <React.Fragment key={game.id}>
                          {/* Home Team Row */}
                          <tr
                            className={`${gameRowClass} ${hoverClass} transition border-l-4 border-l-blue-500`}
                          >
                            <td className="px-2 py-1" rowSpan={2}>
                              <div className="flex items-center gap-1">
                                {getGameResultIcon(game)}
                                <span className="font-semibold text-gray-900 text-xs">
                                  {game.game_order ?? index + 1}
                                </span>
                              </div>
                            </td>

                            <td
                              className="px-2 py-1 text-xs text-gray-600"
                              rowSpan={2}
                            >
                              <div>
                                {game.kick_off_time
                                  ? formatDate(game.kick_off_time)
                                  : "-"}
                              </div>
                              {game.country && (
                                <div className="text-xs text-gray-500">
                                  {game.country}{" "}
                                  {game.tournament && `(${game.tournament})`}
                                </div>
                              )}
                            </td>

                            <td className="px-2 py-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-blue-600 font-medium">
                                  HOME
                                </span>
                                <span
                                  className={`font-semibold text-xs ${
                                    homeWon ? "text-blue-600" : "text-blue-600"
                                  }`}
                                >
                                  {game.home_team}
                                </span>
                                {homeWon && !isDraw && (
                                  <span className="text-blue-600 text-xs">
                                    🏆
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-2 py-1 text-center" rowSpan={2}>
                              {hasScores ? (
                                <div className="text-center">
                                  <div
                                    className={`text-base font-bold ${
                                      isDraw
                                        ? "text-yellow-600"
                                        : homeWon
                                        ? "text-blue-600"
                                        : awayWon
                                        ? "text-red-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {game.score_home} - {game.score_away}
                                  </div>
                                  {isDraw && (
                                    <div className="text-xs text-yellow-600 font-medium bg-yellow-50 px-1 py-0.5 rounded">
                                      DRAW
                                    </div>
                                  )}
                                  {homeWon && (
                                    <div className="text-xs text-blue-600 font-medium">
                                      HOME WIN
                                    </div>
                                  )}
                                  {awayWon && (
                                    <div className="text-xs text-red-600 font-medium">
                                      AWAY WIN
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-base font-bold text-gray-400">
                                  - vs -
                                </div>
                              )}
                            </td>

                            <td className="px-2 py-1 text-center" rowSpan={2}>
                              <span className="text-blue-600 font-medium text-sm">
                                {game.odds_home?.toFixed(2) || "-"}
                              </span>
                            </td>

                            <td className="px-2 py-1 text-center" rowSpan={2}>
                              <span className="text-yellow-600 font-medium text-sm">
                                {game.odds_draw?.toFixed(2) || "-"}
                              </span>
                            </td>

                            <td className="px-2 py-1 text-center" rowSpan={2}>
                              <span className="text-red-600 font-medium text-sm">
                                {game.odds_away?.toFixed(2) || "-"}
                              </span>
                            </td>

                            <td className="px-2 py-1 text-center" rowSpan={2}>
                              {getBettingStatusBadge(game.betting_status)}
                            </td>
                          </tr>

                          {/* Away Team Row */}
                          <tr
                            className={`${gameRowClass} ${hoverClass} transition border-l-4 border-l-red-500 border-t-0`}
                          >
                            <td className="px-2 py-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-red-600 font-medium">
                                  AWAY
                                </span>
                                <span
                                  className={`font-semibold text-xs ${
                                    awayWon ? "text-red-600" : "text-red-600"
                                  }`}
                                >
                                  {game.away_team}
                                </span>
                                {awayWon && !isDraw && (
                                  <span className="text-red-600 text-xs">
                                    🏆
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminJackpotGuard>
  );
};

export default SingleJackpotPage;
