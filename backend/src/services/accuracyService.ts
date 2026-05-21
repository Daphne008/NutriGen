import type { PatientCategory } from "@prisma/client";

export type AccuracyFlagSeverity = "info" | "warning" | "error";

export type AccuracyFlag = {
  id: string;
  message: string;
  severity: AccuracyFlagSeverity;
  hint: string;
};

export type AccuracyFoodInput = {
  name: string;
  category: string;
  calories: number;
  carbs: number;
  fat: number;
  portionMultiplier: number;
};

export type AccuracyPatientContext = {
  patientCategory: PatientCategory;
  age: number;
  bmi: number;
  bloodGlucose: number;
  healthRisks: string[];
  requiredCalories: number;
};

const isDiabeticProfile = (ctx: AccuracyPatientContext): boolean =>
  ctx.patientCategory === "DIABETIC" ||
  ctx.bloodGlucose >= 126 ||
  ctx.healthRisks.some((r) => /hypergly|diabet/i.test(r));

const isHypertensiveProfile = (ctx: AccuracyPatientContext): boolean =>
  ctx.healthRisks.some((r) => /hypertens|cardiovascular/i.test(r)) || ctx.bmi >= 32;

const isPediatricLifeStage = (ctx: AccuracyPatientContext): boolean =>
  ctx.patientCategory === "PEDIATRIC" || ctx.age < 18;

const isGeriatricLifeStage = (ctx: AccuracyPatientContext): boolean =>
  ctx.patientCategory === "ELDERLY" || ctx.age >= 65;

export const defaultAgeForCategory = (category: PatientCategory): number => {
  if (category === "PEDIATRIC") return 12;
  if (category === "ELDERLY") return 72;
  if (category === "ATHLETE") return 28;
  return 40;
};

const pushUnique = (flags: AccuracyFlag[], flag: AccuracyFlag): void => {
  if (!flags.some((f) => f.id === flag.id)) flags.push(flag);
};

export const getPatientProfileFlags = (ctx: AccuracyPatientContext): AccuracyFlag[] => {
  const flags: AccuracyFlag[] = [];
  const pediatric = isPediatricLifeStage(ctx);
  const geriatric = isGeriatricLifeStage(ctx);

  if (pediatric && ctx.bmi >= 25) {
    pushUnique(flags, {
      id: "profile-pediatric-adiposity",
      message: "Pediatric patient with elevated BMI for age",
      severity: "warning",
      hint: "Focus on growth-appropriate habits and portion sizes rather than adult weight-loss framing."
    });
  } else if (!pediatric && ctx.bmi >= 30) {
    pushUnique(flags, {
      id: "profile-obese",
      message: "Obese profile (BMI ≥ 30)",
      severity: "warning",
      hint: "Energy deficit and portion control are usually prioritized; monitor saturated fat and refined carbs."
    });
  }
  if (isDiabeticProfile(ctx)) {
    pushUnique(flags, {
      id: "profile-diabetic",
      message: "Diabetic / hyperglycemic profile",
      severity: "warning",
      hint: "Favor low glycemic load, distribute carbs across meals, and limit concentrated sugars."
    });
  }
  if (isHypertensiveProfile(ctx)) {
    pushUnique(flags, {
      id: "profile-hypertension",
      message: "Hypertension / cardiovascular risk",
      severity: "warning",
      hint: "Aim for moderate sodium and adequate potassium-rich produce when possible."
    });
  }
  if (pediatric && !geriatric) {
    pushUnique(flags, {
      id: "profile-pediatric",
      message: "Pediatric patient (< 18 yrs)",
      severity: "warning",
      hint: "Growth, micronutrient density, and age-appropriate portions matter more than aggressive restriction."
    });
    if (ctx.patientCategory === "PEDIATRIC" && ctx.age >= 18) {
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
  if (ctx.healthRisks.some((r) => /depression/i.test(r))) {
    pushUnique(flags, {
      id: "profile-depression",
      message: "Mental health risk noted",
      severity: "info",
      hint: "Sustainable, culturally acceptable meals support adherence alongside clinical care."
    });
  }
  if (ctx.patientCategory === "LOW_INCOME") {
    pushUnique(flags, {
      id: "profile-low-income",
      message: "Food insecurity / low-income context",
      severity: "info",
      hint: "Prefer affordable, shelf-stable equivalents and realistic meal patterns."
    });
  }

  return flags;
};

export const getDietAccuracyFlags = (
  ctx: AccuracyPatientContext,
  foods: AccuracyFoodInput[]
): AccuracyFlag[] => {
  const flags = getPatientProfileFlags(ctx);
  if (foods.length === 0) return flags;

  const pediatric = isPediatricLifeStage(ctx);

  const totals = foods.reduce(
    (acc, f) => {
      const m = f.portionMultiplier;
      acc.carbs += f.carbs * m;
      acc.calories += f.calories * m;
      return acc;
    },
    { carbs: 0, calories: 0 }
  );

  const diabetic = isDiabeticProfile(ctx) && !pediatric;

  for (const item of foods) {
    const carbs = item.carbs * item.portionMultiplier;
    const cat = item.category.toLowerCase();
    const name = item.name.toLowerCase();

    if (diabetic && cat === "fruit" && carbs >= 12) {
      pushUnique(flags, {
        id: `diet-diabetic-fruit-${item.name}`,
        message: `High-glycemic fruit for diabetic patient: ${item.name}`,
        severity: "error",
        hint: `${item.name} contributes ~${carbs.toFixed(0)} g carbs in this portion. Consider berries, smaller portions, or pairing with protein/fiber.`
      });
    }

    if (diabetic && (name.includes("banana") || name.includes("rice")) && carbs >= 20) {
      pushUnique(flags, {
        id: `diet-diabetic-starch-${item.name}`,
        message: `Starchy / high-carb item for diabetic patient: ${item.name}`,
        severity: "error",
        hint: "Rapidly absorbable carbs can spike glucose; use controlled portions or lower-GI alternatives."
      });
    }

    if (diabetic && item.portionMultiplier >= 2 && carbs >= 15) {
      pushUnique(flags, {
        id: `diet-diabetic-portion-${item.name}`,
        message: `Large carb portion for diabetic patient: ${item.name} (×${item.portionMultiplier})`,
        severity: "warning",
        hint: "Doubled portions multiply glycemic load; split across meals or reduce multiplier."
      });
    }

    if (!pediatric && ctx.bmi >= 30 && item.calories * item.portionMultiplier >= 400) {
      pushUnique(flags, {
        id: `diet-obese-calorie-${item.name}`,
        message: `Very energy-dense serving for obese patient: ${item.name}`,
        severity: "warning",
        hint: "Single items over ~400 kcal can make daily deficit harder to achieve."
      });
    }

    if (isPediatricLifeStage(ctx) && item.portionMultiplier >= 2) {
      pushUnique(flags, {
        id: `diet-pediatric-portion-${item.name}`,
        message: `Large portion for pediatric patient: ${item.name} (×${item.portionMultiplier})`,
        severity: "warning",
        hint: "Pediatric portions should match age/weight, not adult plate sizes."
      });
    }

    if (isPediatricLifeStage(ctx) && name.includes("soda") && item.portionMultiplier >= 1) {
      pushUnique(flags, {
        id: `diet-pediatric-sugar-${item.name}`,
        message: `Added sugar drink for pediatric patient: ${item.name}`,
        severity: "error",
        hint: "Limit sugar-sweetened beverages; prioritize milk, water, or small 100% juice portions if appropriate."
      });
    }
  }

  if (isPediatricLifeStage(ctx) && foods.length >= 2) {
    if (totals.calories > ctx.requiredCalories * 1.12) {
      pushUnique(flags, {
        id: "diet-pediatric-high-energy",
        message: `Planned calories exceed pediatric target (~${totals.calories.toFixed(0)} vs ${ctx.requiredCalories.toFixed(0)} kcal)`,
        severity: "warning",
        hint: "Excess energy can support unhealthy weight gain in children; review snacks and portion sizes."
      });
    }
    if (totals.calories < ctx.requiredCalories * 0.88) {
      pushUnique(flags, {
        id: "diet-pediatric-low-energy",
        message: `Planned calories may be low for pediatric growth (~${totals.calories.toFixed(0)} vs ${ctx.requiredCalories.toFixed(0)} kcal)`,
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
      hint: "Many guidelines target moderated daily carbohydrate spread; review meal distribution."
    });
  }

  if (ctx.patientCategory === "ATHLETE" && totals.calories < 2200 && foods.length >= 3) {
    pushUnique(flags, {
      id: "diet-athlete-low-energy",
      message: "Planned calories may be low for athlete profile",
      severity: "warning",
      hint: "Training load often needs higher energy and timed carbs; confirm against activity level."
    });
  }

  return flags;
};
