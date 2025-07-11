"use client";

import React from "react";
import { SportPesaRules } from "@/lib/api/types";

interface Props {
  budgetKsh: number;
  setBudgetKsh: (val: number) => void;
  errors?: { budget?: string };
  calculateCombinations: () => number;
  formatCurrency: (amount: number) => string;
  RULES: SportPesaRules;
}

const BudgetSection: React.FC<Props> = ({
  budgetKsh,
  setBudgetKsh,
  errors,
  calculateCombinations,
  formatCurrency,
  RULES,
}) => {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-3">
        Budget: {formatCurrency(budgetKsh)}
      </label>

      {/* Budget Slider */}
      <div className="space-y-4">
        <input
          type="range"
          min={RULES.costPerBet}
          max={770424}
          step={RULES.costPerBet}
          value={budgetKsh}
          onChange={(e) => setBudgetKsh(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />

        {/* Slider Labels */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>KSh 99 (1 bet)</span>
          <span>KSh 770,424 (7,776 bets - SportPesa Max)</span>
        </div>

        {/* Quick Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "1 Bet", value: 99, desc: "Single bet" },
            { label: "243 Bets", value: 24057, desc: "Max 5 triples" },
            { label: "1,024 Bets", value: 101376, desc: "Max 10 doubles" },
            { label: "7,776 Bets", value: 770424, desc: "Theoretical max" },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setBudgetKsh(preset.value)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                budgetKsh === preset.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              title={preset.desc}
            >
              <div className="font-medium">{preset.label}</div>
              <div className="text-xs opacity-75 mt-1">
                {formatCurrency(preset.value)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {errors?.budget && (
        <p className="text-red-600 text-sm mt-2">{errors.budget}</p>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-900">Combinations:</span>
            <div className="text-2xl font-bold text-blue-700">
              {calculateCombinations()}
            </div>
          </div>
          <div>
            <span className="font-medium text-blue-900">Cost per bet:</span>
            <div className="text-lg font-semibold text-blue-700">
              {formatCurrency(RULES.costPerBet)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;
