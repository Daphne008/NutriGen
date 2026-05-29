"use client";

import { CalorieBarChart } from "@/components/charts/CalorieBarChart";
import { MacroPieChart } from "@/components/charts/MacroPieChart";
import { StudentOpportunitiesPanel } from "@/components/StudentOpportunitiesPanel";
import { PatientReportCard } from "@/components/PatientReportCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { AccuracyFlagsPanel } from "@/components/AccuracyFlagsPanel";
import {
  fallbackReportData,
  getAccuracyFlags,
  normalizePatientReportData,
  type PathologyOption
} from "@/lib/diagnosis";
import {
  PATHOLOGIES_STORAGE_KEY,
  CONTEXT_TITLES_STORAGE_KEY,
  SESSION_REFLECTION_INTRO,
  SESSION_REFLECTION_ITEMS
} from "@/lib/studentOpportunities";
import { expandPathologyTags } from "@/lib/vitalPathologyCategories";
import { macroPercentsFromTotals } from "@/lib/macros";
import type { DietPlanDetail } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function DietEvaluationPage() {
  const params = useParams();
  const id = Number(params.id);
  const [plan, setPlan] = useState<DietPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPathologies, setSelectedPathologies] = useState<PathologyOption[]>([]);
  const [contextTitles, setContextTitles] = useState<string[]>([]);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Invalid plan id.");
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<DietPlanDetail>(`/diet-plans/${id}`);
      setLoading(false);
      if (res.success && res.data) {
        setPlan(res.data);
      } else {
        setError(res.error ?? "Could not load diet plan.");
      }
    })();

    if (typeof window !== "undefined") {
      try {
        const storedPathologies = sessionStorage.getItem(PATHOLOGIES_STORAGE_KEY(id));
        if (storedPathologies) {
          setSelectedPathologies(JSON.parse(storedPathologies) as PathologyOption[]);
        }
        
        const storedContexts = sessionStorage.getItem(CONTEXT_TITLES_STORAGE_KEY(id));
        if (storedContexts) {
          setContextTitles(JSON.parse(storedContexts) as string[]);
        }
      } catch {
        // ignore
      }
    }
  }, [id]);

  const accuracyFlags = useMemo(() => {
    if (!plan) return [];
    const rawData =
      plan.patientReport?.data ?? fallbackReportData(plan.patientCategory, plan.requiredCalories);
    const reportData = normalizePatientReportData(rawData);

    const expandedPathologies = selectedPathologies?.length
      ? expandPathologyTags(selectedPathologies)
      : undefined;

    return getAccuracyFlags(
      plan.patientCategory,
      reportData,
      plan.items.map((item) => ({
        name: item.food.name,
        category: item.food.category,
        calories: item.food.calories,
        carbs: item.food.carbs,
        fat: item.food.fat,
        portionMultiplier: item.portionMultiplier
      })),
      expandedPathologies
    );
  }, [plan, selectedPathologies]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-mutedForeground">Loading evaluation…</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diet evaluation</CardTitle>
          <CardDescription>Unable to load this plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  const totals = plan.evaluation.totals;
  const macroPercents = macroPercentsFromTotals(totals);
  const summaryMetrics = {
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
    sugars: 0,
    fiber: 0,
    sodium: 0
  };

  const slotOrder: Record<string, number> = {
    EARLY_SNACK: 0,
    BREAKFAST: 1,
    MID_SNACK: 2,
    LUNCH: 3,
    AFTERNOON_SNACK: 4,
    DINNER: 5,
    EVENING_SNACK: 6,
    SNACK: 99
  };

  const slotLabel: Record<string, string> = {
    EARLY_SNACK: "Early Snack",
    BREAKFAST: "Breakfast",
    MID_SNACK: "Mid Snack",
    LUNCH: "Lunch",
    AFTERNOON_SNACK: "Afternoon Snack",
    DINNER: "Dinner",
    EVENING_SNACK: "Evening Snack",
    SNACK: "Snack"
  };

  const sortedItems = [...plan.items].sort((a, b) => {
    const slotA = a.mealType === "SNACK" ? (a.snackSlot || "SNACK") : a.mealType;
    const slotB = b.mealType === "SNACK" ? (b.snackSlot || "SNACK") : b.mealType;
    return (slotOrder[slotA] ?? 99) - (slotOrder[slotB] ?? 99);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Simulation Feedback &amp; Assessment</h1>
          <p className="mt-2 text-mutedForeground">
            {[...contextTitles, ...selectedPathologies].length > 0
              ? [...contextTitles, ...selectedPathologies].join(" · ")
              : plan.patientCategory.replace(/_/g, " ")}
            {" · review your submitted plan below"}
          </p>
        </div>
        <Button onClick={() => window.print()} className="print:hidden">
          Download PDF Report
        </Button>
      </div>

      <div className="hidden print:block space-y-4 print:mb-4">
        <PatientReportCard
          loading={false}
          error={null}
          report={plan.patientReport || null}
          contextTitles={contextTitles}
          selectedPathologies={selectedPathologies}
          onPathologiesChange={() => {}}
        />
      </div>

      <div className="hidden print:block space-y-4 mt-8 print:mt-4">
        <h2 className="text-xl font-bold border-b pb-2">Detailed Meal Plan</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Meal</th>
              <th className="py-2">Food Item</th>
              <th className="py-2">Portion</th>
              <th className="py-2">Cals</th>
              <th className="py-2">Pro</th>
              <th className="py-2">Carb</th>
              <th className="py-2">Fat</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedItems.map((item, idx) => {
              const label = item.mealType === "SNACK" ? (item.snackSlot ? slotLabel[item.snackSlot] : "Snack") : slotLabel[item.mealType] || item.mealType;
              return (
                <tr key={idx}>
                  <td className="py-2">{label}</td>
                  <td className="py-2 pr-2">{item.food.name}</td>
                  <td className="py-2">{item.portionMultiplier}x {item.food.portionGram}g</td>
                  <td className="py-2">{(item.food.calories * item.portionMultiplier).toFixed(0)}</td>
                  <td className="py-2">{(item.food.protein * item.portionMultiplier).toFixed(1)}</td>
                  <td className="py-2">{(item.food.carbs * item.portionMultiplier).toFixed(1)}</td>
                  <td className="py-2">{(item.food.fat * item.portionMultiplier).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="print:hidden">
        <StudentOpportunitiesPanel
          title="Skills you practiced in this session"
          description={SESSION_REFLECTION_INTRO}
          items={SESSION_REFLECTION_ITEMS}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="hidden lg:block" aria-hidden />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Calories</dt>
                <dd className="font-medium">{summaryMetrics.calories.toFixed(0)} kcal</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Target</dt>
                <dd className="font-medium">{plan.requiredCalories.toFixed(0)} kcal</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Protein</dt>
                <dd className="font-medium">{summaryMetrics.protein.toFixed(1)} g</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Carbs</dt>
                <dd className="font-medium">{summaryMetrics.carbs.toFixed(1)} g</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Fat</dt>
                <dd className="font-medium">{summaryMetrics.fat.toFixed(1)} g</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Macro distribution</CardTitle>
            <CardDescription>Share of energy from each macronutrient</CardDescription>
          </CardHeader>
          <CardContent>
            <MacroPieChart totals={totals} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calorie comparison</CardTitle>
            <CardDescription>Required energy vs. planned meal totals</CardDescription>
          </CardHeader>
          <CardContent>
            <CalorieBarChart requiredCalories={plan.requiredCalories} actualCalories={totals.calories} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border border-l-4 border-l-primary bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Dietary assessment</CardTitle>
            <CardDescription>Calories, macros, and automated diet feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li
                className={
                  plan.evaluation.score >= 70 ? "font-medium text-emerald-800" : "font-medium text-amber-800"
                }
              >
                {plan.evaluation.score >= 70
                  ? "Overall: plan aligns reasonably with the patient energy target."
                  : "Overall: plan may need adjustment to better match the patient target."}
              </li>
              <li className="text-mutedForeground">
                Macro split (this plan): {macroPercents.proteinPercent}% P / {macroPercents.carbsPercent}% C /{" "}
                {macroPercents.fatPercent}% F
              </li>
              {plan.evaluation.suggestions.map((s) => (
                <li key={s} className="border-l-2 border-primary/30 pl-2 text-mutedForeground">
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!plan.patientReport && (
              <p className="mb-3 text-xs text-amber-800">
                Patient snapshot missing; flags use plan category and targets only.
              </p>
            )}
            <AccuracyFlagsPanel
              flags={accuracyFlags}
              title="Accuracy flags"
              description="Profile fit, pathology tags, and meal choices for this plan. Hover for detail."
              emptyMessage="No mismatches detected for this plan. Add more meals or pathology tags if you expected feedback."
            />
          </CardContent>
        </Card>
      </div>



      <div className="flex flex-wrap gap-3 print:hidden">
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
