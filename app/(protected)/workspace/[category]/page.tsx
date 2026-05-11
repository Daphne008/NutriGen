"use client";

import { DietBuilder } from "@/components/DietBuilder";
import { PatientReportCard } from "@/components/PatientReportCard";
import { apiClient } from "@/lib/api";
import { categoryFromSlug } from "@/lib/categories";
import type { PatientReport } from "@/lib/types";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.category ?? "");
  const category = categoryFromSlug(slug);

  const [report, setReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setError(res.error ?? "Failed to generate report.");
        setReport(null);
      }
    })();
  }, [category]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Planning workspace</h1>
        <p className="mt-2 text-mutedForeground">
          Review the simulated patient report, then build meals. Equivalences update when you focus a row.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <PatientReportCard loading={loading} error={error} report={report} />
        <div>
          {report && (
            <DietBuilder
              patientCategory={category}
              patientReport={report}
              onPlanCreated={(id) => router.push(`/diet-plans/${id}/evaluation`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
