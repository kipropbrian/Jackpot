import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GameSelectionValidation {
  is_valid: boolean;
  total_combinations: number;
  total_cost: number;
  error_message?: string;
  game_selections: { [key: string]: string[] };
  errors: string[];
  combination_type: "singles" | "doubles" | "triples" | "mixed";
  double_count: number;
  triple_count: number;
}

export interface SportPesaRules {
  maxOnlyDoubles: number;
  maxOnlyTriples: number;
  maxCombiningDoubles: number;
  maxCombiningTriples: number;
  costPerBet: number;
}

// Default SportPesa rules
export const SPORTPESA_RULES: SportPesaRules = {
  maxOnlyDoubles: 10,
  maxOnlyTriples: 5,
  maxCombiningDoubles: 9,
  maxCombiningTriples: 5,
  costPerBet: 99,
};

/**
 * Validates game selections according to SportPesa rules
 * @param gameSelections Object containing game selections
 * @returns Validation result with combinations count and cost
 */
export function validateGameSelections(gameSelections: {
  [gameNumber: string]: string[];
}): GameSelectionValidation {
  // Count doubles and triples
  let doubleCount = 0;
  let tripleCount = 0;

  // Calculate total combinations
  let totalCombinations = 1;

  // Count selections per game
  Object.values(gameSelections).forEach((selections) => {
    if (selections.length === 2) doubleCount++;
    if (selections.length === 3) tripleCount++;
    totalCombinations *= selections.length;
  });

  // Validate against rules
  let isValid = true;
  const errors: string[] = [];

  // Determine combination type
  let combinationType: "singles" | "doubles" | "triples" | "mixed" = "singles";
  if (doubleCount > 0 && tripleCount > 0) {
    combinationType = "mixed";
  } else if (doubleCount > 0) {
    combinationType = "doubles";
  } else if (tripleCount > 0) {
    combinationType = "triples";
  }

  if (doubleCount > 0 && tripleCount > 0) {
    // Mixed mode (doubles and triples)
    if (doubleCount > SPORTPESA_RULES.maxCombiningDoubles) {
      isValid = false;
      errors.push(
        `Maximum ${SPORTPESA_RULES.maxCombiningDoubles} doubles allowed when combining with triples`
      );
    }
    if (tripleCount > SPORTPESA_RULES.maxCombiningTriples) {
      isValid = false;
      errors.push(
        `Maximum ${SPORTPESA_RULES.maxCombiningTriples} triples allowed when combining with doubles`
      );
    }
  } else if (doubleCount > 0) {
    // Only doubles
    if (doubleCount > SPORTPESA_RULES.maxOnlyDoubles) {
      isValid = false;
      errors.push(
        `Maximum ${SPORTPESA_RULES.maxOnlyDoubles} doubles allowed when not using triples`
      );
    }
  } else if (tripleCount > 0) {
    // Only triples
    if (tripleCount > SPORTPESA_RULES.maxOnlyTriples) {
      isValid = false;
      errors.push(
        `Maximum ${SPORTPESA_RULES.maxOnlyTriples} triples allowed when not using doubles`
      );
    }
  }

  return {
    is_valid: isValid,
    total_combinations: totalCombinations,
    total_cost: totalCombinations * SPORTPESA_RULES.costPerBet,
    error_message: errors[0],
    errors,
    game_selections: gameSelections,
    combination_type: combinationType,
    double_count: doubleCount,
    triple_count: tripleCount,
  };
}
