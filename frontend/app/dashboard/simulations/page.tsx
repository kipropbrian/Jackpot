'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSimulations } from '@/lib/hooks/use-simulations';
import { Simulation } from '@/lib/api/types';

export default function SimulationsPage() {
  const {
    simulations,
    totalCount,
    currentPage,
    pageSize,
    isLoading,
    error,
    fetchSimulations,
    deleteSimulation,
    goToPage
  } = useSimulations({ autoFetch: true });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format status for display with appropriate color
  const getStatusBadge = (status: string) => {
    let color = '';
    switch (status) {
      case 'pending':
        color = 'bg-yellow-100 text-yellow-800';
        break;
      case 'running':
        color = 'bg-blue-100 text-blue-800';
        break;
      case 'completed':
        color = 'bg-green-100 text-green-800';
        break;
      case 'failed':
        color = 'bg-red-100 text-red-800';
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Handle simulation deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this simulation?')) {
      try {
        await deleteSimulation(id);
      } catch (error) {
        console.error('Failed to delete simulation:', error);
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-lg leading-6 font-medium text-gray-900">My Simulations</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and manage your jackpot simulations
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {simulations.length} of {totalCount} simulations
            </p>
          )}
        </div>
        <Link
          href="/dashboard/simulations/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          New Simulation
        </Link>
      </div>
      
      {error && (
        <div className="border-t border-gray-200 px-4 py-3 bg-red-50 text-red-700">
          Error loading simulations: {error.message}
        </div>
      )}
      
      <div className="border-t border-gray-200">
        {isLoading ? (
          <div className="px-4 py-5 sm:p-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : simulations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Combinations
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {simulations.map((simulation: Simulation) => (
                  <tr key={simulation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/dashboard/simulations/${simulation.id}`} className="hover:text-blue-600">
                          {simulation.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusBadge(simulation.status)}
                        {simulation.status === 'running' && (
                          <span className="ml-2 text-xs text-gray-500">{simulation.progress}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(simulation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {simulation.total_combinations.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      KSh {simulation.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/dashboard/simulations/${simulation.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(simulation.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage * pageSize >= totalCount}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalCount)}
                      </span>{' '}
                      of <span className="font-medium">{totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers would go here */}
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {currentPage}
                      </span>
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage * pageSize >= totalCount}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-12 sm:px-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No simulations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new simulation.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/simulations/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                New Simulation
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
