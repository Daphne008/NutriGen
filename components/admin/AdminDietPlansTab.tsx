"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDietPlan } from "@/lib/types";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, formatLabel, formatNumber } from "./admin-utils";

export function AdminDietPlansTab() {
  const [plans, setPlans] = useState<AdminDietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<AdminDietPlan[]>("/admin/diet-plans");
      if (res.success && res.data) {
        setPlans(res.data);
      } else {
        setError(res.error ?? "Could not load diet plans.");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated diet plans</CardTitle>
        <CardDescription>Review submitted plans across all dietitians.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-mutedForeground">Loading diet plans…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-border/70">
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">Plan #{plan.id}</CardTitle>
                      <CardDescription>
                        {plan.user.name} · {plan.user.email}
                      </CardDescription>
                    </div>
                    <Badge>{formatLabel(plan.patientCategory)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <p className="text-sm">Score: <span className="font-semibold">{formatNumber(plan.score)}</span></p>
                    <p className="text-sm">Items: <span className="font-semibold">{plan.items.length}</span></p>
                    <p className="text-sm">Required: <span className="font-semibold">{formatNumber(plan.requiredCalories)} kcal</span></p>
                    <p className="text-sm">Actual: <span className="font-semibold">{formatNumber(plan.totalCalories)} kcal</span></p>
                  </div>
                  <p className="text-sm text-mutedForeground">Created {formatDate(plan.createdAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.items.slice(0, 4).map((item) => (
                      <Badge key={item.id} variant="outline">
                        {item.food.name} x{formatNumber(item.portionMultiplier)}
                      </Badge>
                    ))}
                    {plan.items.length > 4 ? <Badge variant="outline">+{plan.items.length - 4} more</Badge> : null}
                  </div>
                  <Link href={`/diet-plans/${plan.id}/evaluation`} className="inline-block text-sm font-medium text-primary hover:underline">
                    Open evaluation
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
