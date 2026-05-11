"use client";

import { CalorieBarChart } from "@/components/charts/CalorieBarChart";
import { MacroPieChart } from "@/components/charts/MacroPieChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { macroPercentsFromTotals } from "@/lib/macros";
import type { DietPlanDetail } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const DIAGNOSIS_CHECKLIST = [
  "Obese (BMI > 30)",
  "Diabetic",
  "Hypertension",
  "Pediatric (< 18 yrs)",
  "Geriatric (>= 65 yrs)",
  "Severe Depression",
  "Below Poverty Line"
] as const;

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
  const severityTone =
    plan.evaluation.score >= 80 ? "text-emerald-700" : plan.evaluation.score >= 60 ? "text-amber-700" : "text-rose-700";
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Simulation Feedback &amp; Assessment</h1>
          <p className="mt-2 text-mutedForeground">
            Plan #{plan.id} · {plan.patientCategory.replace(/_/g, " ")} · submitted diagnosis review
          </p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 px-6 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-mutedForeground">Overall score</p>
          <p className={`text-4xl font-bold ${severityTone}`}>{Math.round(plan.evaluation.score)}</p>
          <p className="text-xs text-mutedForeground">out of 100</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Calories</CardDescription>
              <CardTitle className="text-2xl">{totals.calories.toFixed(0)} kcal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-mutedForeground">Target {plan.requiredCalories.toFixed(0)} kcal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Protein</CardDescription>
              <CardTitle className="text-2xl">{totals.protein.toFixed(1)} g</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">~{macroPercents.proteinPercent}% of kcal</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Carbs</CardDescription>
              <CardTitle className="text-2xl">{totals.carbs.toFixed(1)} g</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">~{macroPercents.carbsPercent}% of kcal</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Fat</CardDescription>
              <CardTitle className="text-2xl">{totals.fat.toFixed(1)} g</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">~{macroPercents.fatPercent}% of kcal</Badge>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Calories</dt>
                <dd className="font-medium">{summaryMetrics.calories.toFixed(0)} kcal</dd>
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
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Sugars</dt>
                <dd className="font-medium">{summaryMetrics.sugars.toFixed(1)} g</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Fiber</dt>
                <dd className="font-medium">{summaryMetrics.fiber.toFixed(1)} g</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mutedForeground">Sodium</dt>
                <dd className="font-medium">{summaryMetrics.sodium.toFixed(0)} mg</dd>
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
        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>Dietary Assessment</CardTitle>
            <CardDescription>Outcome based on calorie and macro alignment</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className={severityTone}>
                {plan.evaluation.score >= 70
                  ? "Success: Diet plan does not contradict patient clinical conditions."
                  : "Diagnostic Status: Requires review"}
              </li>
              <li className="text-mutedForeground">
                Macro Distribution: {macroPercents.proteinPercent}% / {macroPercents.carbsPercent}% / {macroPercents.fatPercent}%
              </li>
              {plan.evaluation.suggestions.map((s) => (
                <li key={s} className="text-mutedForeground">
                  • {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>Diagnostic Accuracy</CardTitle>
            <CardDescription>Checklist and missed diagnosis cues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-foreground">
              {DIAGNOSIS_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="border-t border-emerald-100 pt-3">
              <p className="text-xs font-medium text-mutedForeground">Detected misses</p>
              <ul className="mt-2 space-y-1 text-xs text-mutedForeground">
                {plan.evaluation.score >= 70 && <li>No major diagnosis misses flagged.</li>}
                {plan.evaluation.score < 70 &&
                  DIAGNOSIS_CHECKLIST.slice(0, Math.min(3, DIAGNOSIS_CHECKLIST.length)).map((item) => (
                    <li key={`missed-${item}`}>⚠ Missed Diagnosis: You failed to flag {item}</li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          ← Back to dashboard
        </Link>
        <Link href="/dashboard" className="text-sm text-mutedForeground hover:text-foreground">
          Pick another category
        </Link>
      </div>
    </div>
  );
}
