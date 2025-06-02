'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimulations } from '@/lib/hooks/use-simulations';
import { SimulationCreate } from '@/lib/api/types';

export default function NewSimulationPage() {
  const router = useRouter();
  const { createSimulation, isLoading, error } = useSimulations({ autoFetch: false });
  
  const [formData, setFormData] = useState<SimulationCreate>({
    name: '',
    total_combinations: 100,
    cost_per_bet: 50, // Default 50 KES
  });
  
  const [formErrors, setFormErrors] = useState({
    name: '',
    total_combinations: '',
    cost_per_bet: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to numbers
    const parsedValue = type === 'number' ? (value ? parseFloat(value) : 0) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
    
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {
      name: '',
      total_combinations: '',
      cost_per_bet: '',
    };
    let isValid = true;
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Simulation name is required';
      isValid = false;
    }
    
    // Validate total_combinations
    if (!formData.total_combinations || formData.total_combinations <= 0) {
      errors.total_combinations = 'Total combinations must be greater than 0';
      isValid = false;
    }
    
    // Validate cost_per_bet
    if (!formData.cost_per_bet || formData.cost_per_bet <= 0) {
      errors.cost_per_bet = 'Cost per bet must be greater than 0';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const newSimulation = await createSimulation(formData);
      router.push(`/dashboard/simulations`);
    } catch (err) {
      console.error('Error creating simulation:', err);
      // Error is already handled by the hook
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-lg leading-6 font-medium text-gray-900">Create New Simulation</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Set up parameters for your jackpot simulation
        </p>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error.message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Simulation Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                  formErrors.name ? 'border-red-300' : ''
                }`}
                placeholder="My Jackpot Simulation"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Give your simulation a descriptive name to easily identify it later
            </p>
          </div>
          
          <div>
            <label htmlFor="total_combinations" className="block text-sm font-medium text-gray-700">
              Total Combinations
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="total_combinations"
                id="total_combinations"
                min="1"
                max="10000"
                value={formData.total_combinations}
                onChange={handleChange}
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                  formErrors.total_combinations ? 'border-red-300' : ''
                }`}
              />
              {formErrors.total_combinations && (
                <p className="mt-1 text-sm text-red-600">{formErrors.total_combinations}</p>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Number of different bet combinations to simulate (higher numbers will take longer to process)
            </p>
          </div>
          
          <div>
            <label htmlFor="cost_per_bet" className="block text-sm font-medium text-gray-700">
              Cost Per Bet (KES)
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="cost_per_bet"
                id="cost_per_bet"
                min="1"
                value={formData.cost_per_bet}
                onChange={handleChange}
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                  formErrors.cost_per_bet ? 'border-red-300' : ''
                }`}
              />
              {formErrors.cost_per_bet && (
                <p className="mt-1 text-sm text-red-600">{formErrors.cost_per_bet}</p>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Amount in KES spent on each bet combination
            </p>
          </div>
          
          <div className="pt-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Simulation'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">What happens next?</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            After creating a simulation, our system will:
          </p>
          <ol className="mt-2 list-decimal list-inside space-y-1">
            <li>Generate the specified number of random bet combinations</li>
            <li>Simulate each combination against historical jackpot data</li>
            <li>Calculate win/loss statistics and expected returns</li>
            <li>Provide detailed analysis of simulation results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
