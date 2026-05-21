import type { PathologyOption } from "@/lib/diagnosis";

/** Vital row category → pathology choices (matches Website PATHOLOGY_OPTIONS). */
export const VITAL_PATHOLOGY_BY_CATEGORY: Record<string, readonly PathologyOption[]> = {
  bmi: ["Underweight", "Overweight", "Obesity"],
  cvd: ["High Cardiovascular Risk"],
  bp: ["Elevated BP", "Hypertension (Stage 1)", "Hypertension (Stage 2)"],
  lipids: ["Hyperlipidemia", "High LDL", "High TC/HDL Ratio", "Elevated LDL/HDL"],
  diabetes: ["Prediabetic Range", "Diabetic Range"],
  kidney: ["Elevated Albuminuria", "High ACR (Proteinuria)"],
  poverty: ["Below Poverty Line", "Food Insecurity"],
  mental: ["Depression / Anxiety"]
};

export function isVitalCategory(category: string): boolean {
  return category in VITAL_PATHOLOGY_BY_CATEGORY;
}

/** Tags not tied to a clickable vital row (life-stage, etc.). */
export const ADDITIONAL_PATHOLOGY_OPTIONS: readonly PathologyOption[] = [
  "Pediatric Growth Concern",
  "Geriatric Nutrition Concern",
  "Malnutrition",
  "Insulin Resistance"
];

export const VITAL_CATEGORY_LABELS: Record<string, string> = {
  bmi: "BMI-related",
  cvd: "Cardiovascular risk",
  bp: "Blood pressure",
  lipids: "Lipids",
  diabetes: "Glycemic",
  kidney: "Kidney",
  poverty: "Socioeconomic",
  mental: "Mental health"
};

/** Map popup labels to legacy tags used in accuracy rules. */
export function expandPathologyTags(selected: PathologyOption[]): PathologyOption[] {
  const out = new Set<PathologyOption>(selected);
  if (selected.includes("Diabetic Range")) out.add("Type 2 Diabetes");
  if (selected.includes("Prediabetic Range")) out.add("Prediabetes");
  if (selected.includes("Below Poverty Line")) out.add("Food Insecurity");
  if (
    selected.some((p) =>
      ["Elevated BP", "Hypertension (Stage 1)", "Hypertension (Stage 2)"].includes(p)
    )
  ) {
    out.add("Hypertension");
  }
  if (
    selected.some((p) =>
      ["Elevated Albuminuria", "High ACR (Proteinuria)"].includes(p)
    )
  ) {
    out.add("Chronic Kidney Disease");
  }
  return [...out];
}
