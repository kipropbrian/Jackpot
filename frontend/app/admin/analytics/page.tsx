"use client";

import { useSystemStats } from "@/lib/hooks/use-admin";

export default function AdminAnalytics() {
  const { data: stats, isLoading, error } = useSystemStats();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">
          <strong>Error loading analytics:</strong> {error.message}
        </div>
      </div>
    );
  }

  const userStats = stats?.user_stats;
  const simulationStats = stats?.simulation_stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Detailed insights and performance metrics
        </p>
      </div>

      {/* User Analytics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">User Analytics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Growth */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {userStats?.new_users_30_days || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                New Users (30 days)
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Growth rate from previous month
              </div>
            </div>

            {/* User Activity */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {userStats
                  ? Math.round(
                      (userStats.active_last_30_days / userStats.total_users) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500 mt-1">Activity Rate</div>
              <div className="text-xs text-gray-400 mt-2">
                {userStats?.active_last_30_days || 0} of{" "}
                {userStats?.total_users || 0} users active
              </div>
            </div>

            {/* Admin Users */}
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {userStats?.superadmins || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Admin Users</div>
              <div className="text-xs text-gray-400 mt-2">
                System administrators
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Analytics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Simulation Analytics
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Completion Rate */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {simulationStats && simulationStats.total_simulations > 0
                  ? Math.round(
                      (simulationStats.completed_simulations /
                        simulationStats.total_simulations) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500 mt-1">Completion Rate</div>
              <div className="text-xs text-gray-400 mt-2">
                {simulationStats?.completed_simulations || 0} completed
              </div>
            </div>

            {/* Average Cost */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                KSH{" "}
                {simulationStats?.avg_simulation_cost?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Avg Cost</div>
              <div className="text-xs text-gray-400 mt-2">Per simulation</div>
            </div>

            {/* Recent Activity */}
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {simulationStats?.simulations_last_30_days || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Recent (30d)</div>
              <div className="text-xs text-gray-400 mt-2">New simulations</div>
            </div>

            {/* Revenue */}
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                KSH{" "}
                {simulationStats?.total_simulation_cost?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total Revenue</div>
              <div className="text-xs text-gray-400 mt-2">All time</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Status Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Active Users
                </span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: userStats
                          ? `${
                              (userStats.active_users / userStats.total_users) *
                              100
                            }%`
                          : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">
                    {userStats?.active_users || 0}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Inactive Users
                </span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: userStats
                          ? `${
                              (userStats.inactive_users /
                                userStats.total_users) *
                              100
                            }%`
                          : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">
                    {userStats?.inactive_users || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Status Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Simulation Status
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Completed
                </span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width:
                          simulationStats &&
                          simulationStats.total_simulations > 0
                            ? `${
                                (simulationStats.completed_simulations /
                                  simulationStats.total_simulations) *
                                100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">
                    {simulationStats?.completed_simulations || 0}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Running
                </span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width:
                          simulationStats &&
                          simulationStats.total_simulations > 0
                            ? `${
                                (simulationStats.running_simulations /
                                  simulationStats.total_simulations) *
                                100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">
                    {simulationStats?.running_simulations || 0}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Pending
                </span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{
                        width:
                          simulationStats &&
                          simulationStats.total_simulations > 0
                            ? `${
                                (simulationStats.pending_simulations /
                                  simulationStats.total_simulations) *
                                100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-900">
                    {simulationStats?.pending_simulations || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Performance Summary
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {userStats && userStats.total_users > 0
                  ? (
                      (userStats.active_last_30_days / userStats.total_users) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Monthly Active Rate
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {simulationStats && simulationStats.total_simulations > 0
                  ? (
                      (simulationStats.completed_simulations /
                        simulationStats.total_simulations) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600 mt-1">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {simulationStats?.simulations_last_30_days || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Monthly Growth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
