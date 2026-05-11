import type { PatientCategory } from "@/lib/types";

const SLUG_TO_CATEGORY: Record<string, PatientCategory> = {
  pediatric: "PEDIATRIC",
  diabetic: "DIABETIC",
  "low-income": "LOW_INCOME",
  obese: "OBESE",
  elderly: "ELDERLY",
  athletes: "ATHLETE"
};

const CATEGORY_TO_SLUG: Record<PatientCategory, string> = {
  PEDIATRIC: "pediatric",
  DIABETIC: "diabetic",
  LOW_INCOME: "low-income",
  OBESE: "obese",
  ELDERLY: "elderly",
  ATHLETE: "athletes"
};

export function categoryFromSlug(slug: string): PatientCategory | null {
  return SLUG_TO_CATEGORY[slug] ?? null;
}

export function slugFromCategory(category: PatientCategory): string {
  return CATEGORY_TO_SLUG[category];
}

export const DASHBOARD_CATEGORIES: Array<{
  id: string;
  routeCategory: PatientCategory;
  title: string;
  description: string;
}> = [
  {
    id: "pediatric",
    routeCategory: "PEDIATRIC",
    title: "Pediatric",
    description: "Growth-focused nutrition and micronutrient balance."
  },
  {
    id: "diabetic",
    routeCategory: "DIABETIC",
    title: "Diabetic",
    description: "Glycemic control and structured meal timing."
  },
  {
    id: "hypertension",
    routeCategory: "DIABETIC",
    title: "Hypertension",
    description: "Blood-pressure-aware nutrition and sodium-conscious planning."
  },
  {
    id: "obese",
    routeCategory: "OBESE",
    title: "Obese",
    description: "Calorie-aware plans with sustainable habits."
  },
  {
    id: "geriatric",
    routeCategory: "ELDERLY",
    title: "Geriatric",
    description: "Protein adequacy and easy-to-prepare meals."
  },
  {
    id: "severe-depression",
    routeCategory: "ELDERLY",
    title: "Severe Depression",
    description: "Mood-supportive meal rhythm and consistent nutrient coverage."
  },
  {
    id: "below-poverty-line",
    routeCategory: "LOW_INCOME",
    title: "Below Poverty Line",
    description: "Cost-aware swaps and pantry-friendly planning."
  }
];
