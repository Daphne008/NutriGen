export type UserRole = "ADMIN" | "DIETITIAN" | "PATIENT";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AdminUser extends User {
  createdAt: string;
  updatedAt: string;
  _count: {
    reports: number;
    dietPlans: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type PatientCategory =
  | "PEDIATRIC"
  | "DIABETIC"
  | "LOW_INCOME"
  | "OBESE"
  | "ELDERLY"
  | "ATHLETE";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface Food {
  id: number;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionGram: number;
}

export interface PatientReportData {
  age: number;
  bmi: number;
  requiredCalories: number;
  healthRisks: string[];
  bloodGlucose: number;
  macroTargets: {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
}

export interface PatientReport {
  id: number;
  userId: number;
  patientCategory: PatientCategory;
  createdAt: string;
  data: PatientReportData;
}

export interface AdminReport extends PatientReport {
  user: User;
}

export interface FoodEquivalence {
  id: number;
  foodAId: number;
  foodBId: number;
  equivalentRatio: number;
  group: string | null;
  foodA: Food;
  foodB: Food;
}

export interface DietEvaluationTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietEvaluationMacroPercents {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface DietEvaluationResult {
  score: number;
  suggestions: string[];
  totals: DietEvaluationTotals;
  macroPercents: DietEvaluationMacroPercents;
}

export interface DietPlanItem {
  id: number;
  dietPlanId: number;
  foodId: number;
  mealType: MealType;
  portionMultiplier: number;
  food: Food;
}

export type AccuracyFlag = {
  id: string;
  message: string;
  severity: "info" | "warning" | "error";
  hint: string;
};

export interface DietPlanDetail {
  id: number;
  userId: number;
  patientReportId: number | null;
  patientCategory: PatientCategory;
  requiredCalories: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  score: number;
  createdAt: string;
  updatedAt: string;
  items: DietPlanItem[];
  patientReport?: PatientReport | null;
  evaluation: {
    score: number;
    totals: DietEvaluationTotals;
    suggestions: string[];
  };
  accuracyFlags?: AccuracyFlag[];
}

export interface AdminDietPlan extends DietPlanDetail {
  user: User;
}
