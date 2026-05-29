import type { Food, PatientCategory, PatientReportData } from "@/lib/types";

export type AccuracyFlagSeverity = "info" | "warning" | "error" | "success";

export type AccuracyFlag = {
  id: string;
  message: string;
  severity: AccuracyFlagSeverity;
  hint: string;
};

export const PATHOLOGY_OPTIONS = [
  "Type 2 Diabetes",
  "Prediabetes",
  "Diabetic Range",
  "Prediabetic Range",
  "Obesity",
  "Overweight",
  "Underweight",
  "Hypertension",
  "Elevated BP",
  "Hypertension (Stage 1)",
  "Hypertension (Stage 2)",
  "Hyperlipidemia",
  "High Cardiovascular Risk",
  "High LDL",
  "High TC/HDL Ratio",
  "Elevated LDL/HDL",
  "Chronic Kidney Disease",
  "Elevated Albuminuria",
  "High ACR (Proteinuria)",
  "Depression / Anxiety",
  "Food Insecurity",
  "Below Poverty Line",
  "Malnutrition",
  "Insulin Resistance",
  "Pediatric Growth Concern",
  "Geriatric Nutrition Concern"
] as const;

export type PathologyOption = (typeof PATHOLOGY_OPTIONS)[number];

export const VITAL_PATHOLOGY_MAP: Record<string, PathologyOption[]> = {
  bmi: ["Obesity", "Underweight", "Insulin Resistance"],
  bloodGlucose: ["Type 2 Diabetes", "Prediabetes"],
  bloodPressure: ["Hypertension"],
  hba1c: ["Type 2 Diabetes", "Prediabetes"],
  phq9: ["Depression / Anxiety"],
  foodSecurity: ["Food Insecurity", "Malnutrition"],
  incomePovertyRatio: ["Food Insecurity"]
};

type DietFoodInput = {
  name: string;
  category: string;
  calories: number;
  carbs: number;
  fat: number;
  portionMultiplier: number;
};

const isDiabeticProfile = (category: PatientCategory, data: PatientReportData): boolean =>
  category === "DIABETIC" ||
  data.bloodGlucose >= 126 ||
  data.healthRisks.some((r) => /hypergly|diabet/i.test(r));

const isHypertensiveProfile = (data: PatientReportData): boolean =>
  data.healthRisks.some((r) => /hypertens|cardiovascular/i.test(r)) || data.bmi >= 32;

export const isPediatricLifeStage = (category: PatientCategory, data: PatientReportData): boolean =>
  category === "PEDIATRIC" || data.age < 18;

export const isGeriatricLifeStage = (category: PatientCategory, data: PatientReportData): boolean =>
  category === "ELDERLY" || data.age >= 65;

/** Used when evaluation loads a plan without a stored patient report snapshot. */
export function fallbackReportData(category: PatientCategory, requiredCalories: number): PatientReportData {
  const age =
    category === "PEDIATRIC" ? 12 : category === "ELDERLY" ? 72 : category === "ATHLETE" ? 28 : 40;
  return {
    age,
    bmi: category === "OBESE" ? 32 : category === "PEDIATRIC" ? 17 : 24,
    requiredCalories,
    healthRisks:
      category === "PEDIATRIC"
        ? ["Micronutrient deficiency", "Growth delay"]
        : category === "DIABETIC"
          ? ["Hyperglycemia", "Cardiovascular risk"]
          : category === "LOW_INCOME"
            ? ["Food insecurity", "Low diet diversity"]
            : [],
    bloodGlucose: category === "DIABETIC" ? 150 : 95,
    macroTargets: { proteinPercent: 25, carbsPercent: 50, fatPercent: 25 }
  };
}

const pushUnique = (flags: AccuracyFlag[], flag: AccuracyFlag): void => {
  if (!flags.some((f) => f.id === flag.id)) flags.push(flag);
};

/** Coerce Prisma JSON numbers and guard missing fields. */
export function normalizePatientReportData(
  data: PatientReportData | Record<string, unknown>
): PatientReportData {
  const raw = data as Record<string, unknown>;
  const macro = (raw.macroTargets ?? {}) as Record<string, unknown>;
  return {
    age: Number(raw.age ?? 0),
    bmi: Number(raw.bmi ?? 0),
    requiredCalories: Number(raw.requiredCalories ?? 2000),
    bloodGlucose: Number(raw.bloodGlucose ?? 100),
    healthRisks: Array.isArray(raw.healthRisks) ? (raw.healthRisks as string[]) : [],
    macroTargets: {
      proteinPercent: Number(macro.proteinPercent ?? 25),
      carbsPercent: Number(macro.carbsPercent ?? 50),
      fatPercent: Number(macro.fatPercent ?? 25)
    }
  };
}

/** Determines what pathologies a perfect student would check based on the vitals */
export function getExpectedPathologies(
  category: PatientCategory,
  data: PatientReportData
): Set<PathologyOption> {
  const expected = new Set<PathologyOption>();
  
  if (data.bmi < 18.5) expected.add("Underweight");
  else if (data.bmi >= 30) expected.add("Obesity");
  else if (data.bmi >= 25) expected.add("Overweight");
  
  if (data.bloodGlucose >= 126) expected.add("Type 2 Diabetes");
  else if (data.bloodGlucose >= 100) expected.add("Prediabetes");
  
  if (isHypertensiveProfile(data)) {
    expected.add("Hypertension");
    expected.add("High Cardiovascular Risk");
  }
  
  if (category === "LOW_INCOME") {
    expected.add("Food Insecurity");
    expected.add("Below Poverty Line");
  }
  
  if (data.healthRisks.some(r => /depression/i.test(r))) {
    expected.add("Depression / Anxiety");
  }
  
  if (isPediatricLifeStage(category, data)) {
    expected.add("Pediatric Growth Concern");
  } else if (isGeriatricLifeStage(category, data)) {
    expected.add("Geriatric Nutrition Concern");
  }
  
  return expected;
}

export const getPatientProfileFlags = (category: PatientCategory, data: PatientReportData): AccuracyFlag[] => {
  const flags: AccuracyFlag[] = [];
  const pediatric = isPediatricLifeStage(category, data);
  const geriatric = isGeriatricLifeStage(category, data);

  if (pediatric && data.bmi >= 25) {
    pushUnique(flags, {
      id: "profile-pediatric-adiposity",
      message: "Pediatric patient with elevated BMI for age",
      severity: "info",
      hint: "Focus on growth-appropriate habits and portion sizes rather than adult weight-loss framing."
    });
  } else if (!pediatric && data.bmi >= 30) {
    pushUnique(flags, {
      id: "profile-obese",
      message: "Obese profile (BMI ≥ 30)",
      severity: "info",
      hint: "Energy deficit and portion control are usually prioritized; monitor saturated fat and refined carbs."
    });
  }
  if (isDiabeticProfile(category, data)) {
    pushUnique(flags, {
      id: "profile-diabetic",
      message: "Diabetic / hyperglycemic profile",
      severity: "info",
      hint: "Favor low glycemic load, distribute carbs across meals, and limit concentrated sugars."
    });
  }
  if (isHypertensiveProfile(data)) {
    pushUnique(flags, {
      id: "profile-hypertension",
      message: "Hypertension / cardiovascular risk",
      severity: "info",
      hint: "Aim for moderate sodium and adequate potassium-rich produce when possible."
    });
  }
  if (pediatric && !geriatric) {
    pushUnique(flags, {
      id: "profile-pediatric",
      message: "Pediatric patient (< 18 yrs)",
      severity: "info",
      hint: "Growth, micronutrient density, and age-appropriate portions matter more than aggressive restriction."
    });
    if (category === "PEDIATRIC" && data.age >= 18) {
      pushUnique(flags, {
        id: "profile-pediatric-age-mismatch",
        message: "Pediatric category selected but generated age is 18 or older",
        severity: "warning",
        hint: "Regenerate the patient or align meal targets with adolescent vs. child guidelines."
      });
    }
  } else if (geriatric && !pediatric) {
    pushUnique(flags, {
      id: "profile-geriatric",
      message: "Geriatric patient (≥ 65 yrs)",
      severity: "info",
      hint: "Watch protein adequacy, hydration, and ease of chewing/swallowing."
    });
  }
  if (data.healthRisks.some((r) => /depression/i.test(r))) {
    pushUnique(flags, {
      id: "profile-depression",
      message: "Mental health risk noted",
      severity: "info",
      hint: "Sustainable, culturally acceptable meals support adherence alongside clinical care."
    });
  }
  if (category === "LOW_INCOME") {
    pushUnique(flags, {
      id: "profile-low-income",
      message: "Food insecurity / low-income context",
      severity: "info",
      hint: "Prefer affordable, shelf-stable equivalents and realistic meal patterns."
    });
  }

  return flags;
};

/** @deprecated Use getAccuracyFlags — kept for short labels in legacy call sites */
export function getSuspectedClinicalFlags(category: PatientCategory, data: PatientReportData): string[] {
  return getPatientProfileFlags(category, data).map((f) => f.message);
}

export function getAccuracyFlags(
  category: PatientCategory,
  data: PatientReportData,
  dietFoods?: DietFoodInput[],
  selectedPathologies?: PathologyOption[]
): AccuracyFlag[] {
  const normalized = normalizePatientReportData(data);
  const flags = getPatientProfileFlags(category, normalized);
  const pediatric = isPediatricLifeStage(category, normalized);
  const geriatric = isGeriatricLifeStage(category, normalized);

  if (dietFoods && dietFoods.length > 0) {
    const diabetic = isDiabeticProfile(category, normalized) && !pediatric;
    const totals = dietFoods.reduce(
      (acc, f) => {
        const m = f.portionMultiplier;
        acc.carbs += f.carbs * m;
        acc.calories += f.calories * m;
        return acc;
      },
      { carbs: 0, calories: 0 }
    );

    for (const item of dietFoods) {
      const carbs = item.carbs * item.portionMultiplier;
      const cat = item.category.toLowerCase();
      const name = item.name.toLowerCase();

      if (diabetic && cat === "fruit" && carbs >= 12) {
        pushUnique(flags, {
          id: `diet-diabetic-fruit-${item.name}`,
          message: `High-glycemic fruit for diabetic patient: ${item.name}`,
          severity: "error",
          hint: `${item.name} adds ~${carbs.toFixed(0)} g carbs in this portion. Consider smaller portions or lower-GI alternatives.`
        });
      }

      if (diabetic && (name.includes("banana") || name.includes("rice")) && carbs >= 20) {
        pushUnique(flags, {
          id: `diet-diabetic-starch-${item.name}`,
          message: `Starchy / high-carb item for diabetic patient: ${item.name}`,
          severity: "error",
          hint: "Rapidly absorbable carbs can spike glucose; use controlled portions or equivalents."
        });
      }

      if (diabetic && item.portionMultiplier >= 2 && carbs >= 15) {
        pushUnique(flags, {
          id: `diet-diabetic-portion-${item.name}`,
          message: `Large carb portion for diabetic patient: ${item.name} (×${item.portionMultiplier})`,
          severity: "warning",
          hint: "Doubled portions multiply glycemic load; split across meals or reduce the multiplier."
        });
      }

      if (!pediatric && normalized.bmi >= 30 && item.calories * item.portionMultiplier >= 400) {
        pushUnique(flags, {
          id: `diet-obese-calorie-${item.name}`,
          message: `Very energy-dense serving for obese patient: ${item.name}`,
          severity: "warning",
          hint: "Single items over ~400 kcal can make a daily deficit harder to achieve."
        });
      }

      if (pediatric && item.portionMultiplier >= 2) {
        pushUnique(flags, {
          id: `diet-pediatric-portion-${item.name}`,
          message: `Large portion for pediatric patient: ${item.name} (×${item.portionMultiplier})`,
          severity: "warning",
          hint: "Pediatric portions should match age and weight, not adult plate sizes."
        });
      }

      if (pediatric && name.includes("soda") && item.portionMultiplier >= 1) {
        pushUnique(flags, {
          id: `diet-pediatric-sugar-${item.name}`,
          message: `Added sugar drink for pediatric patient: ${item.name}`,
          severity: "error",
          hint: "Limit sugar-sweetened beverages; prioritize milk, water, or small 100% juice portions if appropriate."
        });
      }
    }

    if (pediatric && dietFoods.length >= 2) {
      if (totals.calories > normalized.requiredCalories * 1.12) {
        pushUnique(flags, {
          id: "diet-pediatric-high-energy",
          message: `Planned calories exceed pediatric target (~${totals.calories.toFixed(0)} vs ${normalized.requiredCalories.toFixed(0)} kcal)`,
          severity: "warning",
          hint: "Excess energy can support unhealthy weight gain in children; review snacks and portion sizes."
        });
      }
      if (totals.calories < normalized.requiredCalories * 0.88) {
        pushUnique(flags, {
          id: "diet-pediatric-low-energy",
          message: `Planned calories may be low for pediatric growth (~${totals.calories.toFixed(0)} vs ${normalized.requiredCalories.toFixed(0)} kcal)`,
          severity: "warning",
          hint: "Children need adequate energy and protein for growth; avoid overly restrictive patterns."
        });
      }
    }

    if (diabetic && totals.carbs > 180) {
      pushUnique(flags, {
        id: "diet-diabetic-total-carbs",
        message: `Total plan carbs high for diabetic profile (~${totals.carbs.toFixed(0)} g)`,
        severity: "error",
        hint: "Spread carbohydrates across meals and favor fiber-rich, low-GI sources."
      });
    }

    if (category === "ATHLETE" && totals.calories < 2200 && dietFoods.length >= 3 && !pediatric) {
      pushUnique(flags, {
        id: "diet-athlete-low-energy",
        message: "Planned calories may be low for athlete profile",
        severity: "warning",
        hint: "Confirm energy against training load; athletes often need higher total intake."
      });
    }
  }

  if (selectedPathologies?.length) {
    const hasDiabetesPathology = selectedPathologies.some(
      (p) =>
        p.includes("Diabetes") ||
        p === "Prediabetes" ||
        p === "Prediabetic Range" ||
        p === "Diabetic Range"
    );
    if (hasDiabetesPathology && !isDiabeticProfile(category, normalized) && normalized.bloodGlucose < 110) {
      pushUnique(flags, {
        id: "dx-glucose-mismatch",
        message: "You selected a diabetes-related pathology but fasting glucose looks near-normal",
        severity: "warning",
        hint: "Re-check HbA1c, post-prandial values, or whether this is prediabetes vs. type 2."
      });
    }
    if (selectedPathologies.includes("Obesity") && normalized.bmi < 27) {
      pushUnique(flags, {
        id: "dx-bmi-mismatch",
        message: "Obesity pathology selected but BMI is below typical obesity cutoff",
        severity: "warning",
        hint: "Consider central adiposity, waist circumference, or cardiometabolic risk instead."
      });
    }
    if (selectedPathologies.includes("Underweight") && normalized.bmi >= 18.5) {
      pushUnique(flags, {
        id: "dx-underweight-mismatch",
        message: "Underweight pathology selected but BMI is not below 18.5",
        severity: "warning",
        hint: "Confirm weight history, edema, or muscle loss before labeling underweight."
      });
    }
    const hasObesity = selectedPathologies.includes("Obesity");
    const hasUnderweight = selectedPathologies.includes("Underweight");
    if (hasObesity && hasUnderweight) {
      pushUnique(flags, {
        id: "dx-obesity-underweight-conflict",
        message: "Conflicting pathologies: Obesity and Underweight cannot both apply",
        severity: "warning",
        hint: "Choose the weight status that best fits the anthropometric data."
      });
    }
    const hasPediatricDx = selectedPathologies.includes("Pediatric Growth Concern");
    const hasGeriatricDx = selectedPathologies.includes("Geriatric Nutrition Concern");
    if (hasPediatricDx && hasGeriatricDx) {
      pushUnique(flags, {
        id: "dx-pediatric-geriatric-conflict",
        message: "Conflicting pathologies: Pediatric and Geriatric concerns cannot both apply",
        severity: "warning",
        hint: "Life-stage tags must match a single age group for this patient."
      });
    }
    if (hasPediatricDx && (normalized.age >= 18 || geriatric)) {
      pushUnique(flags, {
        id: "dx-pediatric-tag-age-mismatch",
        message: "Pediatric Growth Concern tagged but patient age is not in a child/adolescent range",
        severity: "warning",
        hint: "Confirm age on the profile or switch to geriatric / adult pathologies."
      });
    }
    if (hasGeriatricDx && (normalized.age < 65 || pediatric)) {
      pushUnique(flags, {
        id: "dx-geriatric-tag-age-mismatch",
        message: "Geriatric Nutrition Concern tagged but patient age is below 65",
        severity: "warning",
        hint: "Geriatric tags should align with older adult profiles."
      });
    }
    if (pediatric && !hasPediatricDx && normalized.age < 18) {
      pushUnique(flags, {
        id: "dx-pediatric-tag-missing",
        message: "Pediatric case: consider tagging Pediatric Growth Concern if growth or intake is a focus",
        severity: "warning",
        hint: "Life-stage tagging is part of the differential exercise for pediatric simulations."
      });
    }
  }

  // Differential diagnosis checks (Correct vs Missed)
  if (selectedPathologies) {
    const expected = getExpectedPathologies(category, normalized);
    const selectedSet = new Set(selectedPathologies);
    
    // Group aliases so we don't punish them for picking "Diabetic Range" instead of "Type 2 Diabetes"
    const isDiabetesAlias = (p: string) => p.includes("Diabet") || p.includes("Prediabet");
    const isHypertensionAlias = (p: string) => p.includes("Hypertension") || p.includes("Elevated BP") || p.includes("High Cardiovascular Risk");

    // 1. Check for correctly identified tags
    for (const tag of selectedSet) {
      // If it's explicitly expected, or if it's a valid alias for an expected tag
      const isExpected = expected.has(tag) || 
        (isDiabetesAlias(tag) && (expected.has("Type 2 Diabetes") || expected.has("Prediabetes"))) ||
        (isHypertensionAlias(tag) && expected.has("Hypertension"));

      if (isExpected) {
        pushUnique(flags, {
          id: `dx-correct-${tag}`,
          message: `Correctly identified: ${tag}`,
          severity: "success",
          hint: "Good catch! You successfully correlated the vitals/profile with this diagnosis."
        });
      }
    }

    // 2. Check for missed tags
    for (const expectedTag of expected) {
      let missed = !selectedSet.has(expectedTag);
      
      // Alias resolution for misses
      if (isDiabetesAlias(expectedTag) && Array.from(selectedSet).some(isDiabetesAlias)) {
        missed = false;
      }
      if (isHypertensionAlias(expectedTag) && Array.from(selectedSet).some(isHypertensionAlias)) {
        missed = false;
      }
      // Below Poverty Line / Food Insecurity are often grouped
      if (expectedTag === "Below Poverty Line" && selectedSet.has("Food Insecurity")) missed = false;
      if (expectedTag === "Food Insecurity" && selectedSet.has("Below Poverty Line")) missed = false;

      if (missed) {
        pushUnique(flags, {
          id: `dx-missed-${expectedTag}`,
          message: `Missed diagnosis: ${expectedTag}`,
          severity: "warning",
          hint: "The patient's clinical profile strongly indicated this, but it wasn't checked in the differential."
        });
      }
    }
  }

  return flags.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function severityRank(s: AccuracyFlagSeverity): number {
  if (s === "error") return 4;
  if (s === "warning") return 3;
  if (s === "success") return 2;
  return 1;
}

export function dietFoodsFromRows(
  rows: Array<{ food: Food; portionMultiplier: number }>
): DietFoodInput[] {
  return rows.map((r) => ({
    name: r.food.name,
    category: r.food.category,
    calories: r.food.calories,
    carbs: r.food.carbs,
    fat: r.food.fat,
    portionMultiplier: r.portionMultiplier
  }));
}
