import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientReport } from "@/lib/types";
import type { ReactNode } from "react";
import { useState } from "react";

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProfileRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2.5 text-sm leading-6 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] sm:items-start sm:gap-x-4">
      <div className="min-w-0 text-mutedForeground">{label}</div>
      <div className="min-w-0 break-words font-medium sm:text-right">{value}</div>
    </div>
  );
}

function ProfileBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <h4 className="mb-2 text-sm font-semibold leading-snug">{title}</h4>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

export function PatientReportCard({
  loading,
  error,
  report
}: {
  loading: boolean;
  error: string | null;
  report: PatientReport | null;
}) {
  const [notes, setNotes] = useState("");

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Clinical Profile</CardTitle>
          <CardDescription>Generating simulated profile...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-mutedForeground">Please wait while we create category-specific vitals and targets.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Patient Clinical Profile</CardTitle>
          <CardDescription>Could not load data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  const d = report.data;
  const profile = {
    age: d.age,
    gender: d.age % 2 === 0 ? "Male" : "Female",
    weightKg: Number((d.bmi * 2.65).toFixed(1)),
    heightCm: Number((160 + (d.age % 20) * 0.8).toFixed(1)),
    waistCm: Number((78 + d.bmi * 1.35).toFixed(1)),
    whr: Number((0.65 + Math.min(d.bmi, 40) * 0.003).toFixed(2)),
    bloodPressure: d.bloodGlucose > 130 ? "142/97 mmHg" : "126/82 mmHg",
    hdl: "undefined mg/dL",
    totalCholesterol: "undefined mg/dL",
    ldl: "undefined mg/dL",
    hba1c: d.bloodGlucose > 130 ? "7.4%" : "5.8%",
    urineAlbumin: d.bloodGlucose > 130 ? "35.6 mg/L" : "11.2 mg/L",
    urineCreatinine: d.bloodGlucose > 130 ? "133.3 mg/dL" : "104.6 mg/dL",
    acr: d.bloodGlucose > 130 ? "26.7 mg/g" : "10.7 mg/g",
    selfRatedDietQuality: "Unknown/Missing",
    foodSecurity: report.patientCategory === "LOW_INCOME" ? "Low/Unstable" : "High/Full",
    totalCalories: `${Math.round(d.requiredCalories * 0.87)} kcal`,
    protein: "undefined g",
    totalSugars: "97.1 g",
    totalFat: "undefined g",
    dietaryFiber: "undefined g",
    sodium: "2944 mg",
    incomePovertyRatio: report.patientCategory === "LOW_INCOME" ? "0.68" : "1.74",
    phq9: d.healthRisks.some((risk) => risk.toLowerCase().includes("depression")) ? "14 (Moderate)" : "null/Unknown",
    sleep: "7.8 hours/night",
    sedentary: "120 minutes/day"
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Patient Clinical Profile</CardTitle>
            <CardDescription>Click on abnormal vitals to assign your suspected diagnosis.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{formatCategory(report.patientCategory)}</Badge>
            <Button type="button" variant="outline" size="sm">
              New Patient
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <section className="grid gap-4 lg:grid-cols-2">
              <ProfileBlock title="Demographic Profile">
                <ProfileRow label="Age:" value={profile.age} />
                <ProfileRow label="Gender:" value={profile.gender} />
              </ProfileBlock>
              <ProfileBlock title="Anthropometric Measurements">
                <ProfileRow label="Weight:" value={`${profile.weightKg} kg`} />
                <ProfileRow label="Height:" value={`${profile.heightCm} cm`} />
                <ProfileRow label="Waist Circumference:" value={`${profile.waistCm} cm`} />
                <ProfileRow label="Waist-to-Height Ratio:" value={profile.whr} />
                <ProfileRow label="BMI:" value={d.bmi} />
              </ProfileBlock>
            </section>

            <section className="rounded-lg border border-border bg-white p-4">
              <h4 className="mb-2 text-sm font-semibold leading-snug">Cardiovascular &amp; Metabolic Health</h4>
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div className="divide-y divide-border/50">
                  <ProfileRow label="Blood Pressure:" value={profile.bloodPressure} />
                  <ProfileRow label="HDL:" value={profile.hdl} />
                  <ProfileRow label="TC/HDL Risk Ratio:" value="N/A" />
                  <ProfileRow label="Urine Albumin:" value={profile.urineAlbumin} />
                  <ProfileRow label="Albumin-to-Creatinine (ACR):" value={profile.acr} />
                </div>
                <div className="divide-y divide-border/50">
                  <ProfileRow label="Total Cholesterol:" value={profile.totalCholesterol} />
                  <ProfileRow label="LDL:" value={profile.ldl} />
                  <ProfileRow label="HbA1c:" value={profile.hba1c} />
                  <ProfileRow label="Urine Creatinine:" value={profile.urineCreatinine} />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-white p-4">
              <h4 className="mb-2 text-sm font-semibold leading-snug">Dietary Recall (24-Hour) &amp; Security</h4>
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div className="divide-y divide-border/50">
                  <ProfileRow label="Self-Rated Diet Quality:" value={profile.selfRatedDietQuality} />
                  <ProfileRow label="Total Calories:" value={profile.totalCalories} />
                  <ProfileRow label="Protein:" value={profile.protein} />
                  <ProfileRow label="Total Sugars:" value={profile.totalSugars} />
                  <ProfileRow label="Total Fat:" value={profile.totalFat} />
                </div>
                <div className="divide-y divide-border/50">
                  <ProfileRow label="Food Security Status:" value={profile.foodSecurity} />
                  <ProfileRow label="Macronutrients:" value="(undefined%C / undefined%F / undefined%P)" />
                  <ProfileRow label="Carbohydrates:" value="undefined g" />
                  <ProfileRow label="Dietary Fiber:" value={profile.dietaryFiber} />
                  <ProfileRow label="Sodium:" value={profile.sodium} />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-white p-4">
              <h4 className="mb-2 text-sm font-semibold leading-snug">Lifestyle, Mental Health &amp; Socioeconomic</h4>
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div className="divide-y divide-border/50">
                  <ProfileRow label="Income-to-Poverty Ratio:" value={profile.incomePovertyRatio} />
                  <ProfileRow label="Sleep:" value={profile.sleep} />
                </div>
                <div className="divide-y divide-border/50">
                  <ProfileRow label="PHQ-9 Depression Score:" value={profile.phq9} />
                  <ProfileRow label="Sedentary Time:" value={profile.sedentary} />
                </div>
              </div>
            </section>
          </div>

          <aside className="rounded-lg border border-border bg-white p-4">
            <h4 className="text-sm font-semibold">Clinical Notes Scratchpad</h4>
            <p className="mt-1 text-xs text-mutedForeground">Record your differential diagnosis and intervention rationale.</p>
            <textarea
              className="mt-3 h-[560px] w-full resize-none rounded-md border border-border p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Patient appears to have metabolic syndrome risk and requires sodium moderation..."
            />
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}
