"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import type { AdminReport } from "@/lib/types";
import { useEffect, useState } from "react";
import { formatDate, formatLabel, formatNumber } from "./admin-utils";

export function AdminReportsTab() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<AdminReport[]>("/admin/reports");
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setError(res.error ?? "Could not load reports.");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Generated patient reports across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-mutedForeground">Loading reports…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {reports.map((report) => (
              <Card key={report.id} className="border-border/70">
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">Report #{report.id}</CardTitle>
                      <CardDescription>
                        {report.user.name} · {report.user.email}
                      </CardDescription>
                    </div>
                    <Badge>{formatLabel(report.patientCategory)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  <p>Age: <span className="font-semibold">{report.data.age}</span></p>
                  <p>BMI: <span className="font-semibold">{formatNumber(report.data.bmi)}</span></p>
                  <p>Required calories: <span className="font-semibold">{formatNumber(report.data.requiredCalories)} kcal</span></p>
                  <p>Blood glucose: <span className="font-semibold">{formatNumber(report.data.bloodGlucose)} mg/dL</span></p>
                  <p className="text-mutedForeground">Created {formatDate(report.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
