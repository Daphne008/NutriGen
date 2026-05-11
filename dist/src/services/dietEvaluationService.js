"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateDietPlan = void 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const evaluateDietPlan = (input) => {
    const totals = input.foods.reduce((acc, food) => {
        acc.calories += food.calories * food.portionMultiplier;
        acc.protein += food.protein * food.portionMultiplier;
        acc.carbs += food.carbs * food.portionMultiplier;
        acc.fat += food.fat * food.portionMultiplier;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const totalCalories = Math.max(totals.calories, 1);
    const macroPercents = {
        proteinPercent: (totals.protein * 4 * 100) / totalCalories,
        carbsPercent: (totals.carbs * 4 * 100) / totalCalories,
        fatPercent: (totals.fat * 9 * 100) / totalCalories
    };
    const target = input.macroTargets ?? { proteinPercent: 25, carbsPercent: 45, fatPercent: 30 };
    const caloriePenalty = Math.abs(input.requiredCalories - totals.calories) / Math.max(input.requiredCalories, 1) * 35;
    const proteinPenalty = Math.abs(target.proteinPercent - macroPercents.proteinPercent) * 0.7;
    const carbsPenalty = Math.abs(target.carbsPercent - macroPercents.carbsPercent) * 0.5;
    const fatPenalty = Math.abs(target.fatPercent - macroPercents.fatPercent) * 0.5;
    const score = clamp(Math.round(100 - caloriePenalty - proteinPenalty - carbsPenalty - fatPenalty), 0, 100);
    const suggestions = [];
    if (totals.calories < input.requiredCalories * 0.9)
        suggestions.push("Total calories are below requirement.");
    if (totals.calories > input.requiredCalories * 1.1)
        suggestions.push("Total calories are above requirement.");
    if (macroPercents.proteinPercent < target.proteinPercent - 4)
        suggestions.push("Protein intake is slightly low.");
    if (macroPercents.carbsPercent > target.carbsPercent + 6)
        suggestions.push("Carbohydrate ratio is high.");
    if (macroPercents.fatPercent > target.fatPercent + 5)
        suggestions.push("Fat ratio is above target range.");
    if (suggestions.length === 0)
        suggestions.push("Diet composition is within recommended ranges.");
    return {
        totals: {
            calories: Number(totals.calories.toFixed(1)),
            protein: Number(totals.protein.toFixed(1)),
            carbs: Number(totals.carbs.toFixed(1)),
            fat: Number(totals.fat.toFixed(1))
        },
        macroPercents: {
            proteinPercent: Number(macroPercents.proteinPercent.toFixed(1)),
            carbsPercent: Number(macroPercents.carbsPercent.toFixed(1)),
            fatPercent: Number(macroPercents.fatPercent.toFixed(1))
        },
        score,
        suggestions
    };
};
exports.evaluateDietPlan = evaluateDietPlan;
