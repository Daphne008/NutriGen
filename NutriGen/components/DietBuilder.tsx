"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import type { Food, FoodEquivalence, MealType, PatientCategory, PatientReport } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type BuilderRow = {
  rowId: string;
  food: Food;
  mealType: MealType;
  snackSlot?: SnackSlot;
  portionMultiplier: number;
};

type MealSlot = "EARLY_SNACK" | "BREAKFAST" | "MID_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "DINNER" | "EVENING_SNACK";
type SnackSlot = "EARLY_SNACK" | "MID_SNACK" | "AFTERNOON_SNACK" | "EVENING_SNACK";

const MEAL_SLOTS: MealSlot[] = [
  "EARLY_SNACK",
  "BREAKFAST",
  "MID_SNACK",
  "LUNCH",
  "AFTERNOON_SNACK",
  "DINNER",
  "EVENING_SNACK"
];

const SNACK_SLOTS: SnackSlot[] = ["EARLY_SNACK", "MID_SNACK", "AFTERNOON_SNACK", "EVENING_SNACK"];

const mealLabel: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack"
};

const slotLabel: Record<MealSlot, string> = {
  EARLY_SNACK: "Early Morning Snack",
  BREAKFAST: "Breakfast",
  MID_SNACK: "Mid-Morning Snack",
  LUNCH: "Lunch",
  AFTERNOON_SNACK: "Afternoon Snack",
  DINNER: "Dinner",
  EVENING_SNACK: "Evening Snack"
};

export function DietBuilder({
  patientCategory,
  patientReport,
  onPlanCreated
}: {
  patientCategory: PatientCategory;
  patientReport: PatientReport;
  onPlanCreated: (planId: number) => void;
}) {
  const [rows, setRows] = useState<BuilderRow[]>([]);
  const [search, setSearch] = useState("");
  const [foodDataset, setFoodDataset] = useState<Food[]>([]);
  const [loadingDataset, setLoadingDataset] = useState(true);
  const [activeSlot, setActiveSlot] = useState<MealSlot>("EARLY_SNACK");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [equivFoodId, setEquivFoodId] = useState<number | null>(null);
  const [equivs, setEquivs] = useState<FoodEquivalence[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoadingDataset(true);
      const res = await apiClient.get<Food[]>("/foods");
      setLoadingDataset(false);
      if (res.success && res.data) {
        setFoodDataset(res.data);
      }
    })();
  }, []);

  const foods = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return foodDataset;
    return foodDataset.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  }, [foodDataset, search]);

  useEffect(() => {
    if (!equivFoodId) {
      setEquivs([]);
      return;
    }
    void (async () => {
      const res = await apiClient.get<FoodEquivalence[]>(`/equivalences/${equivFoodId}`);
      if (res.success && res.data) {
        setEquivs(res.data);
      }
    })();
  }, [equivFoodId]);

  const selectedRow = useMemo(() => rows.find((r) => r.rowId === selectedRowId) ?? null, [rows, selectedRowId]);

  const previewTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const m = r.portionMultiplier;
        acc.calories += r.food.calories * m;
        acc.protein += r.food.protein * m;
        acc.carbs += r.food.carbs * m;
        acc.fat += r.food.fat * m;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [rows]);

  const summaryMetrics = useMemo(
    () => ({
      calories: previewTotals.calories,
      protein: previewTotals.protein,
      carbs: previewTotals.carbs,
      fat: previewTotals.fat,
      sugars: 0,
      fiber: 0,
      sodium: 0
    }),
    [previewTotals]
  );

  const mapSlotToMeal = (slot: MealSlot): MealType => {
    if (slot === "BREAKFAST" || slot === "LUNCH" || slot === "DINNER") {
      return slot;
    }
    return "SNACK";
  };

  function addFood(food: Food) {
    const mappedMeal = mapSlotToMeal(activeSlot);
    setRows((prev) => [
      ...prev,
      {
        rowId:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${food.id}-${Date.now()}-${Math.random()}`,
        food,
        mealType: mappedMeal,
        snackSlot: mappedMeal === "SNACK" ? (activeSlot as SnackSlot) : undefined,
        portionMultiplier: 1
      }
    ]);
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
    if (selectedRowId === rowId) {
      setSelectedRowId(null);
      setEquivFoodId(null);
    }
  }

  function updatePortion(rowId: string, value: number) {
    const next = Number.isFinite(value) && value > 0 ? value : 0.25;
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, portionMultiplier: next } : r)));
  }

  function changeMeal(rowId: string, mealType: MealType) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        if (mealType === "SNACK") {
          return { ...r, mealType, snackSlot: r.snackSlot ?? "MID_SNACK" };
        }
        return { ...r, mealType, snackSlot: undefined };
      })
    );
  }

  function changeSnackSlot(rowId: string, snackSlot: SnackSlot) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, mealType: "SNACK", snackSlot } : r)));
  }

  function selectRow(row: BuilderRow) {
    setSelectedRowId(row.rowId);
    setEquivFoodId(row.food.id);
  }

  function replaceFoodFromEquiv(rowId: string, newFood: Food) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, food: newFood } : r)));
    setEquivFoodId(newFood.id);
  }

  async function finishPlan() {
    setError(null);
    if (rows.length === 0) {
      setError("Add at least one food to create a diet plan.");
      return;
    }
    setSaving(true);
    const res = await apiClient.post<{ id: number }>("/diet-plans", {
      patientCategory,
      patientReportId: patientReport.id,
      items: rows.map((r) => ({
        foodId: r.food.id,
        mealType: r.mealType,
        snackSlot: r.snackSlot,
        portionMultiplier: r.portionMultiplier
      }))
    });
    setSaving(false);
    if (res.success && res.data?.id != null) {
      onPlanCreated(res.data.id);
      return;
    }
    setError(res.error ?? "Could not save diet plan.");
  }

  const bySlot = useMemo(() => {
    const map: Record<MealSlot, BuilderRow[]> = {
      EARLY_SNACK: [],
      BREAKFAST: [],
      MID_SNACK: [],
      LUNCH: [],
      AFTERNOON_SNACK: [],
      DINNER: [],
      EVENING_SNACK: []
    };
    rows.forEach((r) => {
      if (r.mealType === "BREAKFAST" || r.mealType === "LUNCH" || r.mealType === "DINNER") {
        map[r.mealType].push(r);
      } else {
        map[r.snackSlot ?? "MID_SNACK"].push(r);
      }
    });
    return map;
  }, [rows]);

  const mealPlanSection = (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Daily diet plan</h3>
      <p className="text-xs text-mutedForeground">
        Early morning snack through evening snack — complete this before summary and submit.
      </p>
      {MEAL_SLOTS.map((slot) => (
        <div key={slot}>
          <h4 className="mb-2 text-sm font-semibold text-foreground">{slotLabel[slot]}</h4>
          <div className="space-y-2">
            {bySlot[slot].length === 0 && <p className="text-xs text-mutedForeground">No foods yet.</p>}
            {bySlot[slot].map((row) => (
              <div
                key={row.rowId}
                className={`flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between ${
                  selectedRowId === row.rowId ? "border-primary bg-primary/5" : "border-border bg-white"
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.food.name}</span>
                    <span className="text-xs text-mutedForeground">
                      {Math.round(row.food.calories * row.portionMultiplier)} kcal · P {row.food.protein} · C{" "}
                      {row.food.carbs} · F {row.food.fat}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <label className="flex items-center gap-1 text-mutedForeground">
                      Portion ×
                      <Input
                        className="h-8 w-20"
                        type="number"
                        min={0.25}
                        step={0.25}
                        value={row.portionMultiplier}
                        onChange={(e) => updatePortion(row.rowId, Number(e.target.value))}
                      />
                    </label>
                    <select
                      className="h-8 rounded-md border border-border px-2 text-xs"
                      value={row.mealType}
                      onChange={(e) => changeMeal(row.rowId, e.target.value as MealType)}
                    >
                      {(["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as MealType[]).map((m) => (
                        <option key={m} value={m}>
                          {mealLabel[m]}
                        </option>
                      ))}
                    </select>
                    {row.mealType === "SNACK" && (
                      <select
                        className="h-8 rounded-md border border-border px-2 text-xs"
                        value={row.snackSlot ?? "MID_SNACK"}
                        onChange={(e) => changeSnackSlot(row.rowId, e.target.value as SnackSlot)}
                      >
                        {SNACK_SLOTS.map((snackSlot) => (
                          <option key={snackSlot} value={snackSlot}>
                            {slotLabel[snackSlot]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => selectRow(row)}>
                    Equivalents
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(row.rowId)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dietary Intervention &amp; Diagnosis Submission</CardTitle>
          <CardDescription>
            Design a customized daily diet plan and submit your interactive diagnosis for AI assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium" htmlFor="food-search">
                Search foods
              </label>
              <Input
                id="food-search"
                placeholder="e.g. chicken, apple, rice…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:w-48">
              <label className="text-sm font-medium" htmlFor="meal-select">
                Add to meal
              </label>
              <select
                id="meal-select"
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={activeSlot}
                onChange={(e) => setActiveSlot(e.target.value as MealSlot)}
              >
                {MEAL_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slotLabel[slot]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-mutedForeground">
              {loadingDataset ? "Loading food dataset…" : `Food dataset (${foodDataset.length} items)`}
            </p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
              {foods.map((food) => (
                <li key={food.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-white">
                  <span>
                    {food.name}{" "}
                    <span className="text-mutedForeground">
                      ({Math.round(food.calories)} kcal / {food.portionGram}g)
                    </span>
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => addFood(food)}>
                    Add
                  </Button>
                </li>
              ))}
              {!loadingDataset && foods.length === 0 && (
                <li className="text-mutedForeground">No foods match your search.</li>
              )}
            </ul>
          </div>

          {mealPlanSection}

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-md bg-primary/5 p-3 text-sm text-foreground">
              <p className="font-medium">Equivalence suggestions</p>
              <p className="mt-1 text-xs text-mutedForeground">
                Select a meal row above, then use a suggested swap to replace that row&apos;s food.
              </p>
              <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto text-xs">
                {equivFoodId == null && <li className="text-mutedForeground">Select a meal row to load equivalents.</li>}
                {equivFoodId != null &&
                  equivs.map((eq) => {
                    const currentId = selectedRow?.food.id ?? equivFoodId;
                    const other = eq.foodAId === currentId ? eq.foodB : eq.foodA;
                    return (
                      <li key={eq.id} className="rounded border border-border bg-white p-2">
                        <div className="flex items-start justify-between gap-2">
                          <span>
                            <span className="font-medium">{other.name}</span>
                            {eq.group && <span className="text-mutedForeground"> · {eq.group}</span>}
                            <span className="block text-mutedForeground">
                              Ratio {eq.equivalentRatio.toFixed(2)} vs selected food
                            </span>
                          </span>
                          {selectedRowId && (
                            <Button type="button" size="sm" variant="ghost" onClick={() => replaceFoodFromEquiv(selectedRowId, other)}>
                              Use
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                {equivFoodId != null && equivs.length === 0 && (
                  <li className="text-mutedForeground">No equivalence rules for this food yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-sm font-semibold">Live Plan Summary</p>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <dt>Calories</dt>
                  <dd className="font-medium">{summaryMetrics.calories.toFixed(0)} kcal</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Protein</dt>
                  <dd className="font-medium">{summaryMetrics.protein.toFixed(1)} g</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Carbs</dt>
                  <dd className="font-medium">{summaryMetrics.carbs.toFixed(1)} g</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Fat</dt>
                  <dd className="font-medium">{summaryMetrics.fat.toFixed(1)} g</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Sugars</dt>
                  <dd className="font-medium">{summaryMetrics.sugars.toFixed(1)} g</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Fiber</dt>
                  <dd className="font-medium">{summaryMetrics.fiber.toFixed(1)} g</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Sodium</dt>
                  <dd className="font-medium">{summaryMetrics.sodium.toFixed(0)} mg</dd>
                </div>
              </dl>
              <Button type="button" className="mt-4 w-full" disabled={saving || rows.length === 0} onClick={() => void finishPlan()}>
                {saving ? "Submitting…" : "Submit Plan & Diagnosis"}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
