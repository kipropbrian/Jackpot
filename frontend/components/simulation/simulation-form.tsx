"use client";
import React, { useState, useEffect } from "react";
import { useSimulations } from '@/lib/hooks/use-simulations';

export interface SimulationFormValues {
  name: string;
  total_combinations: number;
  cost_per_bet: number;
}

interface SimulationFormProps {
  onSubmit?: (values: SimulationFormValues) => void;
}

const SimulationForm: React.FC<SimulationFormProps> = ({ onSubmit }) => {
  const { simulations } = useSimulations({ autoFetch: true });
  // Format today's date as dd/mm/yy
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear().toString().slice(-2)}`;
  // Count only simulations created today
  const todayISO = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const todaysCount = simulations.filter(sim => sim.created_at && sim.created_at.slice(0, 10) === todayISO).length;
  const defaultName = `${todaysCount + 1}-${dateStr}-mega`;

  const [values, setValues] = useState<SimulationFormValues>({
    name: defaultName,
    total_combinations: 100,
    cost_per_bet: 50,
  });

  // Update name if totalCount changes (e.g., after a new simulation is created)
  useEffect(() => {
    setValues((prev) => ({ ...prev, name: `${todaysCount + 1}-${dateStr}-mega` }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysCount]);
  const [errors, setErrors] = useState<Partial<Record<keyof SimulationFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!values.name.trim()) errs.name = "Name is required";
    if (!values.total_combinations || isNaN(Number(values.total_combinations))) errs.total_combinations = "Enter a valid number of combinations";
    if (!values.cost_per_bet || isNaN(Number(values.cost_per_bet))) errs.cost_per_bet = "Enter a valid cost per bet";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          name: values.name.trim(),
          total_combinations: Number(values.total_combinations),
          cost_per_bet: Number(values.cost_per_bet),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Simulation</h2>
      <div>
        <label className="block text-gray-700 font-semibold mb-1" htmlFor="name">Simulation Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g. Mega Jackpot Pro 17"
        />
        {errors.name && <div className="text-red-600 text-xs mt-1">{errors.name}</div>}
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-1" htmlFor="total_combinations">Total Combinations</label>
        <input
          type="number"
          id="total_combinations"
          name="total_combinations"
          value={values.total_combinations}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 ${errors.total_combinations ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g. 10000"
          min={1}
        />
        {errors.total_combinations && <div className="text-red-600 text-xs mt-1">{errors.total_combinations}</div>}
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-1" htmlFor="cost_per_bet">Cost Per Bet (Ksh)</label>
        <input
          type="number"
          id="cost_per_bet"
          name="cost_per_bet"
          value={values.cost_per_bet}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 ${errors.cost_per_bet ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="e.g. 20"
          min={1}
          step={0.01}
        />
        {errors.cost_per_bet && <div className="text-red-600 text-xs mt-1">{errors.cost_per_bet}</div>}
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Create Simulation"}
      </button>
    </form>
  );
};

export default SimulationForm;
