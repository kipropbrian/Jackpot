"use client";
import React from "react";
import { useJackpots } from "@/lib/hooks/use-jackpots";
import Link from "next/link";
import AdminJackpotGuard from "@/components/admin/admin-jackpot-guard";

const JackpotsPage: React.FC = () => {
  const { jackpots, loading, error } = useJackpots();

  return (
    <AdminJackpotGuard>
      <div className="bg-white shadow rounded-lg">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-10 flex items-center gap-3">
            <span className="inline-block text-yellow-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 inline"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.657-1.343-3-3-3zm0 0V4m0 16v-4m8-4h-4m-8 0H4"
                />
              </svg>
            </span>
            SportPesa Mega Jackpots
          </h1>
          {loading && (
            <div className="text-lg text-gray-600 animate-pulse">
              Loading jackpots...
            </div>
          )}
          {error && (
            <div className="text-red-400 font-semibold">Error: {error}</div>
          )}
          {!loading && !error && jackpots.length === 0 && (
            <div className="text-gray-600 text-lg">No jackpots available.</div>
          )}
          {!loading && !error && jackpots.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Matches
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jackpots.map((jackpot, idx) => (
                    <tr
                      key={jackpot.id}
                      className={
                        idx % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50 hover:bg-gray-100 transition"
                      }
                    >
                      <td className="px-4 py-3 text-blue-600 font-semibold">
                        <Link
                          href={`/dashboard/jackpots/${jackpot.id}`}
                          className="hover:underline"
                        >
                          {jackpot.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {jackpot.total_matches}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-semibold">
                        Ksh {jackpot.current_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(jackpot.scraped_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminJackpotGuard>
  );
};

export default JackpotsPage;
