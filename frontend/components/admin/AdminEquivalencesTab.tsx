"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import type { Food, FoodEquivalence } from "@/lib/types";
import { useEffect, useState } from "react";
import { formatNumber } from "./admin-utils";

type EquivalenceFormState = {
  foodAId: string;
  foodBId: string;
  equivalentRatio: string;
  group: string;
};

const emptyForm: EquivalenceFormState = {
  foodAId: "",
  foodBId: "",
  equivalentRatio: "",
  group: ""
};

export function AdminEquivalencesTab() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [equivalences, setEquivalences] = useState<FoodEquivalence[]>([]);
  const [form, setForm] = useState<EquivalenceFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [foodsRes, eqRes] = await Promise.all([
      apiClient.get<Food[]>("/foods"),
      apiClient.get<FoodEquivalence[]>("/equivalences")
    ]);

    if (foodsRes.success && foodsRes.data) {
      setFoods(foodsRes.data);
    } else {
      setError(foodsRes.error ?? "Could not load foods.");
    }

    if (eqRes.success && eqRes.data) {
      setEquivalences(eqRes.data);
    } else {
      setError(eqRes.error ?? "Could not load equivalences.");
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await apiClient.post("/admin/equivalences", {
      foodAId: Number(form.foodAId),
      foodBId: Number(form.foodBId),
      equivalentRatio: Number(form.equivalentRatio),
      group: form.group.trim() || null
    });

    if (res.success) {
      setForm(emptyForm);
      setMessage("Equivalence created.");
      await loadData();
    } else {
      setError(res.error ?? "Could not create equivalence.");
    }

    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equivalence table</CardTitle>
        <CardDescription>Create substitution rules between foods.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
          <select
            className="h-10 rounded-md border border-border bg-white px-3 text-sm"
            value={form.foodAId}
            onChange={(e) => setForm((p) => ({ ...p, foodAId: e.target.value }))}
          >
            <option value="">Select food A</option>
            {foods.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-border bg-white px-3 text-sm"
            value={form.foodBId}
            onChange={(e) => setForm((p) => ({ ...p, foodBId: e.target.value }))}
          >
            <option value="">Select food B</option>
            {foods.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Equivalent ratio"
            type="number"
            step="0.01"
            value={form.equivalentRatio}
            onChange={(e) => setForm((p) => ({ ...p, equivalentRatio: e.target.value }))}
          />
          <Input placeholder="Group (optional)" value={form.group} onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))} />
          <Button type="submit" disabled={saving}>Add equivalence</Button>
        </form>

        {loading ? <p className="text-sm text-mutedForeground">Loading equivalences…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-primary">{message}</p> : null}

        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-mutedForeground">
                <tr>
                  <th className="px-3 py-2 font-medium">Food A</th>
                  <th className="px-3 py-2 font-medium">Food B</th>
                  <th className="px-3 py-2 font-medium">Ratio</th>
                  <th className="px-3 py-2 font-medium">Group</th>
                </tr>
              </thead>
              <tbody>
                {equivalences.map((equivalence) => (
                  <tr key={equivalence.id} className="border-b border-border/60">
                    <td className="px-3 py-3">{equivalence.foodA.name}</td>
                    <td className="px-3 py-3">{equivalence.foodB.name}</td>
                    <td className="px-3 py-3">{formatNumber(equivalence.equivalentRatio, 2)}</td>
                    <td className="px-3 py-3">{equivalence.group ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
