/** Dashboard / landing: what the platform lets you do next (forward-looking). */
export const PLATFORM_CAPABILITIES = [
  {
    title: "Pick a clinical theme",
    description:
      "Choose one or more case themes on the Dashboard (e.g. Pediatric, Diabetic). Pediatric and Geriatric cannot be combined."
  },
  {
    title: "Generate a MediGAN patient",
    description:
      "Open the workspace to receive a synthetic profile with vitals, labs, and dietary recall—no real patient data."
  },
  {
    title: "Build a full-day plan",
    description:
      "Add foods from early snack through evening snack, use equivalence swaps, and keep notes in the scratchpad."
  },
  {
    title: "Submit for review",
    description:
      "Send your plan once it is complete; accuracy flags and dietary feedback appear on the evaluation screen afterward."
  }
] as const;

/** Evaluation page — intro under “Skills you practiced in this session”. */
export const SESSION_REFLECTION_INTRO =
  "After you submitted your plan, NutriGen checked it against the patient profile, the pathologies you tagged, and your meal choices. The items below summarize that review.";

/** Evaluation page: what this submitted session exercised (reflection). */
export const SESSION_REFLECTION_ITEMS = [
  {
    title: "Energy and profile fit",
    description:
      "Whether total calories and macros were reasonable for this patient’s age, category, and target intake."
  },
  {
    title: "Pathology consistency",
    description:
      "Whether the tags you chose match the vitals—and whether conflicting labels (e.g. obesity vs underweight) were flagged."
  },
  {
    title: "Food and portion choices",
    description:
      "Whether specific meals fit the case, such as portion size for pediatric patients or carb load when glycemic risk applies."
  },
  {
    title: "Integrated feedback",
    description:
      "Charts, dietary notes, and accuracy flags combined into one debrief for this plan."
  }
] as const;

/** @deprecated Use PLATFORM_CAPABILITIES or SESSION_REFLECTION_ITEMS */
export const STUDENT_OPPORTUNITIES = PLATFORM_CAPABILITIES;

export const MEDIAGAN_INTRO =
  "NutriGen uses a MediGAN-based pipeline to synthesize category-conditioned patient records for dietetics education—bridging theory and clinical reasoning without exposing real health data.";

export const PATHOLOGIES_STORAGE_KEY = (planId: number) => `nutrigen-pathologies-${planId}`;
