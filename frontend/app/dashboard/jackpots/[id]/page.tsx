"use client";
import { useRouter, useParams } from 'next/navigation';
import React from 'react';
import { useJackpot } from '@/lib/hooks/use-jackpot';
import type { Game } from '@/lib/api/types';

const SingleJackpotPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const { jackpot, loading, error } = useJackpot(id);

  if (loading) return <div className="p-8 text-gray-600 animate-pulse">Loading jackpot…</div>;
  if (error || !jackpot) return <div className="p-8 text-red-400">Error: {error ?? 'Jackpot not found'}</div>;

  return (
    <div className="bg-white shadow rounded-lg p-8">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-500 mb-6 inline-flex items-center gap-1"
          >
            ← Back to jackpots
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
            {jackpot.name}
          </h1>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-gray-700 space-y-1">
                <div><span className="font-semibold text-blue-600">Matches:</span> {jackpot.total_matches}</div>
                <div><span className="font-semibold text-blue-600">Scraped:</span> {new Date(jackpot.scraped_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <span className="uppercase text-xs tracking-wider text-gray-500">Jackpot Amount</span>
                <div className="text-4xl font-extrabold text-green-600">Ksh {jackpot.current_amount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">Games</h2>
          {jackpot.games.length === 0 ? (
            <div className="text-gray-600">No games for this jackpot.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
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
                    <tr
                      key={game.id}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition'}
                    >
                      <td className="px-3 py-2 text-center text-gray-700 font-semibold">
                        {game.game_order ?? i + 1}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {game.kick_off_time ? new Date(game.kick_off_time).toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2 font-bold text-blue-600">{game.home_team}</td>
                      <td className="px-3 py-2 font-bold text-pink-600">{game.away_team}</td>
                      <td className="px-3 py-2 text-gray-700">{game.tournament ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-yellow-600">
                        {game.odds_home ?? '-'} /{' '}
                        <span className="text-gray-500">{game.odds_draw ?? '-'}</span> / {game.odds_away ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {game.betting_status ? (
                          <span
                            className={
                              game.betting_status === 'OPEN'
                                ? 'inline-block px-2 py-1 rounded-full bg-green-600 text-xs text-white font-bold'
                                : game.betting_status === 'CLOSED'
                                ? 'inline-block px-2 py-1 rounded-full bg-red-600 text-xs text-white font-bold'
                                : 'inline-block px-2 py-1 rounded-full bg-gray-400 text-xs text-white font-bold'
                            }
                          >
                            {game.betting_status}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full bg-gray-300 text-xs text-gray-700 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};

export default SingleJackpotPage;
