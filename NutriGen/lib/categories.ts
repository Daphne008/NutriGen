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
    description: "Patients under 18 years of age."
  },
  {
    id: "diabetic",
    routeCategory: "DIABETIC",
    title: "Diabetic",
    description: "Patients with diagnosed diabetes or high blood glucose."
  },
  {
    id: "hypertension",
    routeCategory: "DIABETIC",
    title: "Hypertension",
    description: "Patients with elevated blood pressure or cardiovascular risk."
  },
  {
    id: "obese",
    routeCategory: "OBESE",
    title: "Obese",
    description: "Patients with a BMI of 30 or higher."
  },
  {
    id: "geriatric",
    routeCategory: "ELDERLY",
    title: "Geriatric",
    description: "Patients 65 years of age and older."
  },
  {
    id: "severe-depression",
    routeCategory: "ELDERLY",
    title: "Severe Depression",
    description: "Patients with high PHQ-9 depression scores."
  },
  {
    id: "below-poverty-line",
    routeCategory: "LOW_INCOME",
    title: "Below Poverty Line",
    description: "Patients with a low income-to-poverty ratio or food insecurity."
  }
];
