"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DiagnosticPathologyPopup } from "@/components/DiagnosticPathologyPopup";
import type { PathologyOption } from "@/lib/diagnosis";
import { PATHOLOGY_HOVER, VITAL_HOVER } from "@/lib/hoverContent";
import { PATHOLOGY_EXCLUSIVE_GROUPS, toggleWithExclusive } from "@/lib/pathologyRules";
import {
  ADDITIONAL_PATHOLOGY_OPTIONS,
  isVitalCategory,
  VITAL_PATHOLOGY_BY_CATEGORY
} from "@/lib/vitalPathologyCategories";
import type { PatientReport } from "@/lib/types";
import { type ReactNode, useEffect, useRef, useState } from "react";

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProfileRow({
  label,
  value,
  abnormal
}: {
  label: string;
  value: string | number;
  abnormal?: boolean;
}) {
  return (
    <div
      className={`data-row grid grid-cols-1 gap-1 py-2.5 text-sm leading-6 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] sm:items-start sm:gap-x-4 ${
        abnormal ? "bg-amber-50/50" : ""
      }`}
    >
      <div className="min-w-0 text-mutedForeground">{label}</div>
      <div className={`min-w-0 break-words font-medium sm:text-right ${abnormal ? "text-amber-900" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function InteractiveDataRow({
  label,
  value,
  category,
  abnormal,
  hint,
  active,
  onToggle
}: {
  label: string;
  value: string | number;
  category: string;
  abnormal?: boolean;
  hint?: string;
  active: boolean;
  onToggle: (rowEl: HTMLElement) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-category={category}
      title={hint}
      className={`interactive-row data-row grid cursor-pointer grid-cols-1 gap-1 rounded-md border border-dashed border-transparent py-2.5 text-sm transition-all sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] sm:items-start sm:gap-x-4 ${
        active ? "active border-solid border-primary bg-primary/10" : "hover:border-primary/40 hover:bg-primary/5"
      } ${abnormal ? "bg-amber-50/40" : ""}`}
      onClick={(e) => onToggle(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(e.currentTarget);
        }
      }}
    >
      <span className="min-w-0 text-mutedForeground">{label}</span>
      <b className={`min-w-0 break-words font-semibold sm:text-right ${abnormal ? "text-amber-900" : "text-foreground"}`}>
        {value}
      </b>
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
  report,
  onNewPatient,
  contextTitles = [],
  selectedPathologies,
  onPathologiesChange
}: {
  loading: boolean;
  error: string | null;
  report: PatientReport | null;
  onNewPatient?: () => void;
  contextTitles?: string[];
  selectedPathologies: PathologyOption[];
  onPathologiesChange: (next: PathologyOption[]) => void;
}) {
  const reportPanelRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  const toggleAdditional = (option: PathologyOption) => {
    onPathologiesChange(toggleWithExclusive(selectedPathologies, option, PATHOLOGY_EXCLUSIVE_GROUPS));
  };

  const handleInteractiveClick = (category: string, rowElement: HTMLElement) => {
    if (!isVitalCategory(category)) return;

    if (activeCategory === category) {
      setActiveCategory(null);
      setPopupPosition(null);
      return;
    }

    const panel = reportPanelRef.current;
    if (!panel) return;

    const rowRect = rowElement.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    setPopupPosition({
      top: rowRect.bottom - panelRect.top + 8,
      left: rowRect.left - panelRect.left + 24
    });
    setActiveCategory(category);
  };

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (reportPanelRef.current?.contains(target)) return;
      setActiveCategory(null);
      setPopupPosition(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  const abnormalBmi = d.bmi >= 30;
  const abnormalGlucose = d.bloodGlucose >= 126;
  const abnormalBp = d.bloodGlucose > 130;
  const abnormalHba1c = d.bloodGlucose > 130;
  const abnormalPhq9 = profile.phq9.includes("Moderate");
  const abnormalFoodSecurity = report.patientCategory === "LOW_INCOME";
  const abnormalIncome = report.patientCategory === "LOW_INCOME";

  const activeOptions = activeCategory ? VITAL_PATHOLOGY_BY_CATEGORY[activeCategory] : undefined;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Patient Clinical Profile</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{formatCategory(report.patientCategory)}</Badge>
            {contextTitles.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onNewPatient?.()} disabled={!onNewPatient}>
              New Patient
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {selectedPathologies.length > 0 && (
          <section className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Your selected pathologies</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedPathologies.map((p) => (
                <Badge key={p} variant="outline" className="text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg border border-border bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold">Additional tags (optional)</h4>
          <p className="mb-3 text-xs text-mutedForeground">
            Life-stage and other tags not tied to a single vital row.
          </p>
          <div className="flex flex-wrap gap-2">
            {ADDITIONAL_PATHOLOGY_OPTIONS.map((option) => {
              const active = selectedPathologies.includes(option);
              const hint = PATHOLOGY_HOVER[option] ?? "";
              return (
                <button
                  key={option}
                  type="button"
                  title={hint}
                  onClick={() => toggleAdditional(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-foreground hover:border-primary/50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <div ref={reportPanelRef} className="report-panel relative space-y-4">
          <section className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
            <ProfileBlock title="Demographic Profile">
              <ProfileRow label="Age:" value={profile.age} />
              <ProfileRow label="Gender:" value={profile.gender} />
            </ProfileBlock>

            <ProfileBlock title="Anthropometric Measurements">
              <ProfileRow label="Weight:" value={`${profile.weightKg} kg`} />
              <ProfileRow label="Height:" value={`${profile.heightCm} cm`} />
              <InteractiveDataRow
                label="Waist Circumference:"
                value={`${profile.waistCm} cm`}
                category="cvd"
                hint={VITAL_HOVER.cvd}
                active={activeCategory === "cvd"}
                onToggle={(el) => handleInteractiveClick("cvd", el)}
              />
              <InteractiveDataRow
                label="Waist-to-Height Ratio:"
                value={profile.whr}
                category="cvd"
                hint={VITAL_HOVER.cvd}
                active={activeCategory === "cvd"}
                onToggle={(el) => handleInteractiveClick("cvd", el)}
              />
              <InteractiveDataRow
                label="BMI:"
                value={d.bmi}
                category="bmi"
                abnormal={abnormalBmi}
                hint={VITAL_HOVER.bmi}
                active={activeCategory === "bmi"}
                onToggle={(el) => handleInteractiveClick("bmi", el)}
              />
            </ProfileBlock>
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h4 className="mb-2 text-sm font-semibold leading-snug">Cardiovascular &amp; Metabolic Health</h4>
            <div className="grid gap-6 text-sm md:grid-cols-2 print:grid-cols-2">
              <div className="divide-y divide-border/50">
                <InteractiveDataRow
                  label="Blood Pressure:"
                  value={profile.bloodPressure}
                  category="bp"
                  abnormal={abnormalBp}
                  hint={VITAL_HOVER.bloodPressure}
                  active={activeCategory === "bp"}
                  onToggle={(el) => handleInteractiveClick("bp", el)}
                />
                <ProfileRow label="HDL:" value={profile.hdl} />
                <InteractiveDataRow
                  label="TC/HDL Risk Ratio:"
                  value="N/A"
                  category="lipids"
                  active={activeCategory === "lipids"}
                  onToggle={(el) => handleInteractiveClick("lipids", el)}
                />
                <InteractiveDataRow
                  label="Urine Albumin:"
                  value={profile.urineAlbumin}
                  category="kidney"
                  active={activeCategory === "kidney"}
                  onToggle={(el) => handleInteractiveClick("kidney", el)}
                />
                <InteractiveDataRow
                  label="Albumin-to-Creatinine (ACR):"
                  value={profile.acr}
                  category="kidney"
                  active={activeCategory === "kidney"}
                  onToggle={(el) => handleInteractiveClick("kidney", el)}
                />
              </div>
              <div className="divide-y divide-border/50">
                <InteractiveDataRow
                  label="Total Cholesterol:"
                  value={profile.totalCholesterol}
                  category="lipids"
                  active={activeCategory === "lipids"}
                  onToggle={(el) => handleInteractiveClick("lipids", el)}
                />
                <InteractiveDataRow
                  label="LDL:"
                  value={profile.ldl}
                  category="lipids"
                  active={activeCategory === "lipids"}
                  onToggle={(el) => handleInteractiveClick("lipids", el)}
                />
                <InteractiveDataRow
                  label="HbA1c:"
                  value={profile.hba1c}
                  category="diabetes"
                  abnormal={abnormalHba1c}
                  hint={VITAL_HOVER.hba1c}
                  active={activeCategory === "diabetes"}
                  onToggle={(el) => handleInteractiveClick("diabetes", el)}
                />
                <ProfileRow label="Urine Creatinine:" value={profile.urineCreatinine} />
                <InteractiveDataRow
                  label="Fasting glucose (sim.):"
                  value={`${d.bloodGlucose} mg/dL`}
                  category="diabetes"
                  abnormal={abnormalGlucose}
                  hint={VITAL_HOVER.bloodGlucose}
                  active={activeCategory === "diabetes"}
                  onToggle={(el) => handleInteractiveClick("diabetes", el)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h4 className="mb-2 text-sm font-semibold leading-snug">Dietary Recall (24-Hour) &amp; Security</h4>
            <div className="grid gap-6 text-sm md:grid-cols-2 print:grid-cols-2">
              <div className="divide-y divide-border/50">
                <ProfileRow label="Self-Rated Diet Quality:" value={profile.selfRatedDietQuality} />
                <ProfileRow label="Total Calories:" value={profile.totalCalories} />
                <ProfileRow label="Protein:" value={profile.protein} />
                <ProfileRow label="Total Sugars:" value={profile.totalSugars} />
                <ProfileRow label="Total Fat:" value={profile.totalFat} />
              </div>
              <div className="divide-y divide-border/50">
                <InteractiveDataRow
                  label="Food Security Status:"
                  value={profile.foodSecurity}
                  category="poverty"
                  abnormal={abnormalFoodSecurity}
                  hint={VITAL_HOVER.foodSecurity}
                  active={activeCategory === "poverty"}
                  onToggle={(el) => handleInteractiveClick("poverty", el)}
                />
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
                <InteractiveDataRow
                  label="Income-to-Poverty Ratio:"
                  value={profile.incomePovertyRatio}
                  category="poverty"
                  abnormal={abnormalIncome}
                  hint={VITAL_HOVER.incomePovertyRatio}
                  active={activeCategory === "poverty"}
                  onToggle={(el) => handleInteractiveClick("poverty", el)}
                />
                <ProfileRow label="Sleep:" value={profile.sleep} />
              </div>
              <div className="divide-y divide-border/50">
                <InteractiveDataRow
                  label="PHQ-9 Depression Score:"
                  value={profile.phq9}
                  category="mental"
                  abnormal={abnormalPhq9}
                  hint={VITAL_HOVER.phq9}
                  active={activeCategory === "mental"}
                  onToggle={(el) => handleInteractiveClick("mental", el)}
                />
                <ProfileRow label="Sedentary Time:" value={profile.sedentary} />
              </div>
            </div>
          </section>

          {activeCategory && activeOptions && popupPosition && (
            <DiagnosticPathologyPopup
              category={activeCategory}
              options={activeOptions}
              selectedPathologies={selectedPathologies}
              onPathologiesChange={onPathologiesChange}
              onClose={() => {
                setActiveCategory(null);
                setPopupPosition(null);
              }}
              style={{ top: popupPosition.top, left: popupPosition.left }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
