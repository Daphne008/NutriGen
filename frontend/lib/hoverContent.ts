import type { PathologyOption } from "@/lib/diagnosis";

/** Hover copy aligned with Website PATHOLOGY_OPTIONS / vital categories. */
export const PATHOLOGY_HOVER: Partial<Record<PathologyOption, string>> = {
  "Type 2 Diabetes": "Fasting glucose or HbA1c in diabetic range; plan for distributed carbs and limited added sugars.",
  Prediabetes: "Impaired glucose regulation; emphasize portion control and lower glycemic load.",
  Obesity: "BMI ≥ 30 or high adiposity; energy deficit and sustainable habits are usually prioritized.",
  Underweight: "BMI < 18.5; focus on adequate energy, protein density, and safe weight gain—not restriction.",
  Hypertension: "Elevated BP; moderate sodium, adequate potassium-rich foods, and DASH-style patterns.",
  Hyperlipidemia: "Adverse lipid panel; limit saturated fat and refine carbohydrate quality.",
  "Chronic Kidney Disease": "Albuminuria or elevated ACR; moderate protein if indicated and monitor sodium.",
  "Depression / Anxiety": "PHQ-9 or mental health risk; regular meal rhythm supports adherence.",
  "Food Insecurity": "Low income-to-poverty ratio or unstable access; favor affordable, realistic meals.",
  Malnutrition: "Inadequate intake or micronutrient gaps; cannot be selected with obesity or underweight.",
  "Insulin Resistance": "Metabolic risk without full diabetes criteria; watch refined carbs and central adiposity.",
  "Pediatric Growth Concern": "Age < 18; growth-appropriate calories and micronutrients—not adult restriction.",
  "Geriatric Nutrition Concern": "Age ≥ 65; protein, hydration, and texture—mutually exclusive with pediatric tagging.",
  Overweight: "BMI above healthy range but below obesity cutoff; tailor portions and activity.",
  "Diabetic Range": "HbA1c or glucose in diabetic range; match meal carbs to glycemic targets.",
  "Prediabetic Range": "Impaired fasting glucose or HbA1c; prevention-focused carb distribution.",
  "Elevated BP": "Borderline or high-normal BP; sodium-aware planning may apply.",
  "Hypertension (Stage 1)": "Stage 1 hypertension; DASH-style patterns often relevant.",
  "Hypertension (Stage 2)": "Stage 2 hypertension; stricter sodium and cardiometabolic focus.",
  "High Cardiovascular Risk": "Waist or WHtR suggests central/metabolic risk.",
  "High LDL": "LDL above target; saturated fat and fiber balance matter.",
  "High TC/HDL Ratio": "Unfavorable cholesterol ratio; lipid-focused interventions.",
  "Elevated LDL/HDL": "LDL high relative to HDL; review fat quality and activity.",
  "Elevated Albuminuria": "Urine albumin elevated; kidney-aware protein and sodium.",
  "High ACR (Proteinuria)": "Albumin-to-creatinine ratio high; monitor renal nutrition.",
  "Below Poverty Line": "Income below poverty threshold; cost and access shape meal plans."
};

export const VITAL_HOVER: Record<string, string> = {
  cvd: "Click to open cardiovascular risk pathologies—select manually in the popup.",
  bmi: "Click to open choices—nothing is selected until you check a box. Underweight, Overweight, and Obesity cannot all apply.",
  bloodGlucose: "Assign diabetes-related pathologies when glucose or HbA1c is out of range.",
  bloodPressure: "Elevated readings may support hypertension in your differential.",
  hba1c: "Long-term glycemic control marker; pairs with diabetes pathologies.",
  phq9: "Depression screening score; may support mental health–related nutrition planning.",
  foodSecurity: "Low security may warrant food insecurity or malnutrition tags.",
  incomePovertyRatio: "Socioeconomic barrier to diet quality and food access."
};

export const CATEGORY_HOVER: Record<string, string> = {
  pediatric: "Synthesizes a child/adolescent profile. Cannot combine with Geriatric.",
  diabetic: "Biases glucose and cardiometabolic risk in the MediGAN draw.",
  hypertension: "Emphasizes sodium-sensitive, blood-pressure–aware planning context.",
  obese: "Energy-dense risk patterns and weight-management framing.",
  geriatric: "Older adult targets (protein, ease of prep). Cannot combine with Pediatric.",
  "severe-depression": "Mood-related adherence and meal-structure considerations.",
  "below-poverty-line": "Cost-aware, pantry-friendly intervention context."
};
