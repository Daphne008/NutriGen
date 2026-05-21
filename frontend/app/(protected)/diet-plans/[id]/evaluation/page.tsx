"use client";

import { CalorieBarChart } from "@/components/charts/CalorieBarChart";
import { MacroPieChart } from "@/components/charts/MacroPieChart";
import { StudentOpportunitiesPanel } from "@/components/StudentOpportunitiesPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  }, [id]);

  const accuracyFlags = useMemo(() => {
    if (!plan) return [];
    const rawData =
      plan.patientReport?.data ?? fallbackReportData(plan.patientCategory, plan.requiredCalories);
    const reportData = normalizePatientReportData(rawData);

    let selectedPathologies: PathologyOption[] | undefined;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(PATHOLOGIES_STORAGE_KEY(plan.id));
        if (stored) {
          selectedPathologies = JSON.parse(stored) as PathologyOption[];
        }
      } catch {
        selectedPathologies = undefined;
      }
    }

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
  }, [plan]);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Simulation Feedback &amp; Assessment</h1>
        <p className="mt-2 text-mutedForeground">
          Plan #{plan.id} · {plan.patientCategory.replace(/_/g, " ")} · review your submitted plan below
        </p>
      </div>

      <StudentOpportunitiesPanel
        title="Skills you practiced in this session"
        description={SESSION_REFLECTION_INTRO}
        items={SESSION_REFLECTION_ITEMS}
      />

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

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
