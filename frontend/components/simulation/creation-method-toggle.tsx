"use client";

import React from "react";

export type CreationMethod = "budget" | "interactive";

interface Props {
  creationMethod: CreationMethod;
  onChange: (method: CreationMethod) => void;
}

// A presentational component that renders the two cards (Interactive & Budget)
// and notifies parent when the user toggles between them.
const CreationMethodToggle: React.FC<Props> = ({
  creationMethod,
  onChange,
}) => {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-4">
        Creation Method
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interactive card */}
        <div
          onClick={() => onChange("interactive")}
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
            creationMethod === "interactive"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-200"
          }`}
        >
          <div className="flex items-center mb-3">
            <div
              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                creationMethod === "interactive"
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-400"
              }`}
            />
            <h3 className="font-semibold text-gray-800">
              Interactive Selection
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            Manually select predictions for each game with full control
          </p>
        </div>

        {/* Budget card */}
        <div
          onClick={() => onChange("budget")}
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
            creationMethod === "budget"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-200"
          }`}
        >
          <div className="flex items-center mb-3">
            <div
              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                creationMethod === "budget"
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-400"
              }`}
            />
            <h3 className="font-semibold text-gray-800">Budget-Based</h3>
          </div>
          <p className="text-sm text-gray-600">
            Set your budget and let the system optimize combination distribution
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreationMethodToggle;
