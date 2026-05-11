"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePatientReportData = void 0;
const randomBetween = (min, max) => {
    return Number((Math.random() * (max - min) + min).toFixed(1));
};
const CATEGORY_BASES = {
    PEDIATRIC: {
        age: [6, 16],
        bmi: [14, 21],
        calories: [1400, 2200],
        glucose: [75, 110],
        risks: ["Micronutrient deficiency", "Growth delay"]
    },
    DIABETIC: {
        age: [30, 70],
        bmi: [23, 35],
        calories: [1600, 2400],
        glucose: [130, 220],
        risks: ["Hyperglycemia", "Cardiovascular risk"]
    },
    LOW_INCOME: {
        age: [20, 60],
        bmi: [18, 30],
        calories: [1700, 2300],
        glucose: [80, 130],
        risks: ["Food insecurity", "Low diet diversity"]
    },
    OBESE: {
        age: [25, 65],
        bmi: [30, 45],
        calories: [1800, 2800],
        glucose: [100, 180],
        risks: ["Insulin resistance", "Hypertension"]
    },
    ELDERLY: {
        age: [65, 90],
        bmi: [19, 31],
        calories: [1400, 2100],
        glucose: [85, 145],
        risks: ["Muscle loss", "Bone density decline"]
    },
    ATHLETE: {
        age: [18, 40],
        bmi: [20, 28],
        calories: [2400, 3800],
        glucose: [75, 120],
        risks: ["Recovery deficit", "Electrolyte imbalance"]
    }
};
const generatePatientReportData = (patientCategory) => {
    const base = CATEGORY_BASES[patientCategory];
    const proteinPercent = randomBetween(20, 35);
    const fatPercent = randomBetween(20, 30);
    const carbsPercent = Number((100 - proteinPercent - fatPercent).toFixed(1));
    return {
        age: Math.round(randomBetween(base.age[0], base.age[1])),
        bmi: randomBetween(base.bmi[0], base.bmi[1]),
        requiredCalories: Math.round(randomBetween(base.calories[0], base.calories[1])),
        healthRisks: base.risks,
        bloodGlucose: randomBetween(base.glucose[0], base.glucose[1]),
        macroTargets: { proteinPercent, carbsPercent, fatPercent }
    };
};
exports.generatePatientReportData = generatePatientReportData;
