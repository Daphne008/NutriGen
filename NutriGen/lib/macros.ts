import type { DietEvaluationTotals } from "@/lib/types";

/** Calorie-share percentages for macro pie chart (matches backend evaluation logic). */
export function macroPercentsFromTotals(totals: DietEvaluationTotals): {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
} {
  const pCals = totals.protein * 4;
  const cCals = totals.carbs * 4;
  const fCals = totals.fat * 9;
  const denom = pCals + cCals + fCals;
  if (denom <= 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatPercent: 0 };
  }
  return {
    proteinPercent: Number(((pCals / denom) * 100).toFixed(1)),
    carbsPercent: Number(((cCals / denom) * 100).toFixed(1)),
    fatPercent: Number(((fCals / denom) * 100).toFixed(1))
  };
}
