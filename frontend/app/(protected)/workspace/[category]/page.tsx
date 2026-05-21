"use client";

import { ClinicalScratchpad } from "@/components/ClinicalScratchpad";
import { DietBuilder } from "@/components/DietBuilder";
import { PatientReportCard } from "@/components/PatientReportCard";
import { apiClient } from "@/lib/api";
import { DASHBOARD_CATEGORIES, categoryFromSlug } from "@/lib/categories";
import type { PathologyOption } from "@/lib/diagnosis";
import { PATHOLOGIES_STORAGE_KEY } from "@/lib/studentOpportunities";
import type { PatientReport } from "@/lib/types";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function WorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = String(params.category ?? "");
  const category = categoryFromSlug(slug);

  const ctxParam = searchParams.get("ctx");
  const extraContextTitles = useMemo(() => {
    if (!ctxParam) return [] as string[];
    const ids = ctxParam.split(",").map((s) => s.trim()).filter(Boolean);
    return DASHBOARD_CATEGORIES.filter((c) => ids.includes(c.id)).map((c) => c.title);
  }, [ctxParam]);

  const [report, setReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientSession, setPatientSession] = useState(0);
  const [scratchpadNotes, setScratchpadNotes] = useState("");
  const [selectedPathologies, setSelectedPathologies] = useState<PathologyOption[]>([]);

  useEffect(() => {
    if (!category) {
      return;
    }
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await apiClient.post<PatientReport>("/reports/generate", { patientCategory: category });
      setLoading(false);
      if (res.success && res.data) {
        setReport(res.data);
        setSelectedPathologies([]);
        setScratchpadNotes("");
      } else {
        setError(res.error ?? "Failed to generate report.");
        setReport(null);
      }
    })();
  }, [category, patientSession]);

  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Planning workspace</h1>
        <p className="mt-2 text-mutedForeground">
          Patient profile and clinical notes sit side by side. Build the daily diet plan (breakfast through evening snack)
          before reviewing summary and accuracy flags.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <PatientReportCard
          key={`${category}-${patientSession}`}
          loading={loading}
          error={error}
          report={report}
          contextTitles={extraContextTitles}
          selectedPathologies={selectedPathologies}
          onPathologiesChange={setSelectedPathologies}
          onNewPatient={() => {
            setPatientSession((s) => s + 1);
          }}
        />
        <ClinicalScratchpad notes={scratchpadNotes} onNotesChange={setScratchpadNotes} />
      </div>

      {report && (
        <DietBuilder
          patientCategory={category}
          patientReport={report}
          onPlanCreated={(id) => {
            try {
              sessionStorage.setItem(PATHOLOGIES_STORAGE_KEY(id), JSON.stringify(selectedPathologies));
            } catch {
              /* ignore quota / private mode */
            }
            router.push(`/diet-plans/${id}/evaluation`);
          }}
        />
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-4">
          <p className="text-mutedForeground">Loading workspace…</p>
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
