"use client";
import React from "react";
import { useJackpots } from '@/lib/hooks/use-jackpots';
import type { Game } from '@/lib/api/types';

const JackpotsPage: React.FC = () => {
  const { jackpots, loading, error } = useJackpots();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-16">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold text-white mb-10 flex items-center gap-3">
          <span className="inline-block text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.657-1.343-3-3-3zm0 0V4m0 16v-4m8-4h-4m-8 0H4" /></svg>
          </span>
          SportPesa Jackpots
        </h1>
        {loading && <div className="text-lg text-gray-200 animate-pulse">Loading jackpots...</div>}
        {error && <div className="text-red-400 font-semibold">Error: {error}</div>}
        {!loading && !error && jackpots.length === 0 && (
          <div className="text-gray-400 text-lg">No jackpots available.</div>
        )}
        <div className="space-y-12">
          {jackpots.map((jackpot) => (
            <div key={jackpot.id} className="rounded-xl shadow-xl bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-yellow-300 flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.657-1.343-3-3-3zm0 0V4m0 16v-4m8-4h-4m-8 0H4" /></svg>
                    {jackpot.name}
                  </h2>
                  <div className="text-gray-300 text-lg flex flex-wrap gap-4">
                    <span className="inline-flex items-center gap-1"><span className="font-semibold text-yellow-400">Matches:</span> {jackpot.total_matches}</span>
                    <span className="inline-flex items-center gap-1"><span className="font-semibold text-yellow-400">Last Updated:</span> {new Date(jackpot.scraped_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="uppercase text-xs tracking-wider text-gray-400">Jackpot Amount</span>
                  <span className="text-3xl md:text-4xl font-extrabold text-green-400 drop-shadow-lg">
                    Ksh {jackpot.current_amount.toLocaleString()}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mt-6 mb-3">Games</h3>
              {jackpot.games.length === 0 ? (
                <div className="text-gray-400">No games for this jackpot.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="min-w-full text-sm bg-gray-800 rounded-lg">
                    <thead>
                      <tr className="bg-gray-700 text-gray-200">
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Kickoff</th>
                        <th className="px-3 py-2 text-left font-semibold">Home</th>
                        <th className="px-3 py-2 text-left font-semibold">Away</th>
                        <th className="px-3 py-2 text-left font-semibold">Tournament</th>
                        <th className="px-3 py-2 text-left font-semibold">Odds (H/D/A)</th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jackpot.games.map((game: Game, i: number) => (
                        <tr key={game.id} className={i % 2 === 0 ? "bg-gray-900" : "bg-gray-800 hover:bg-gray-700 transition"}>
                          <td className="px-3 py-2 text-center text-gray-200 font-semibold">{game.game_order ?? i + 1}</td>
                          <td className="px-3 py-2 text-gray-300">{game.kick_off_time ? new Date(game.kick_off_time).toLocaleString() : "-"}</td>
                          <td className="px-3 py-2 font-bold text-blue-300">{game.home_team}</td>
                          <td className="px-3 py-2 font-bold text-pink-300">{game.away_team}</td>
                          <td className="px-3 py-2 text-gray-300">{game.tournament ?? "-"}</td>
                          <td className="px-3 py-2 text-center text-yellow-300">
                            {game.odds_home ?? "-"} / <span className="text-gray-400">{game.odds_draw ?? "-"}</span> / {game.odds_away ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {game.betting_status ? (
                              <span className={
                                game.betting_status === 'OPEN' ?
                                  'inline-block px-2 py-1 rounded-full bg-green-600 text-xs text-white font-bold' :
                                game.betting_status === 'CLOSED' ?
                                  'inline-block px-2 py-1 rounded-full bg-red-600 text-xs text-white font-bold' :
                                  'inline-block px-2 py-1 rounded-full bg-gray-500 text-xs text-white font-bold'
                              }>
                                {game.betting_status}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 rounded-full bg-gray-600 text-xs text-white font-bold">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JackpotsPage;
