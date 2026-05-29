import type { PathologyOption } from "@/lib/diagnosis";

/** Pathology labels that cannot be selected together (e.g. obesity vs underweight). */
export const PATHOLOGY_EXCLUSIVE_GROUPS: PathologyOption[][] = [
  ["Obesity", "Underweight", "Overweight", "Malnutrition"],
  ["Prediabetic Range", "Diabetic Range", "Prediabetes", "Type 2 Diabetes"],
  ["Elevated BP", "Hypertension (Stage 1)", "Hypertension (Stage 2)", "Hypertension"],
  ["Pediatric Growth Concern", "Geriatric Nutrition Concern"]
];

/** Dashboard category ids that cannot be combined (e.g. pediatric vs geriatric). */
export const CATEGORY_EXCLUSIVE_GROUPS: string[][] = [["pediatric", "geriatric"]];

export function toggleWithExclusive<T extends string>(
  selected: T[],
  item: T,
  exclusiveGroups: T[][]
): T[] {
  const isSelected = selected.includes(item);
  if (isSelected) {
    return selected.filter((x) => x !== item);
  }

  let next = [...selected, item];
  for (const group of exclusiveGroups) {
    if (!group.includes(item)) continue;
    next = next.filter((x) => x === item || !group.includes(x));
  }
  return next;
}

export function hasConflictingPathologies(selected: PathologyOption[]): boolean {
  for (const group of PATHOLOGY_EXCLUSIVE_GROUPS) {
    const hits = group.filter((g) => selected.includes(g));
    if (hits.length > 1) return true;
  }
  return false;
}
