"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import type { Food } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatNumber } from "./admin-utils";

type FoodFormState = {
  name: string;
  category: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  portionGram: string;
};

const emptyFoodForm: FoodFormState = {
  name: "",
  category: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  portionGram: ""
};

export function AdminFoodsTab() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<FoodFormState>(emptyFoodForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FoodFormState>(emptyFoodForm);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    const res = await apiClient.get<Food[]>(`/foods${query}`);
    if (res.success && res.data) {
      setFoods(res.data);
    } else {
      setError(res.error ?? "Could not load foods.");
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    void loadFoods();
  }, [loadFoods]);

  const searchedFoods = useMemo(() => foods, [foods]);

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await apiClient.post<Food>("/admin/foods", {
      ...createForm,
      calories: Number(createForm.calories),
      protein: Number(createForm.protein),
      carbs: Number(createForm.carbs),
      fat: Number(createForm.fat),
      portionGram: Number(createForm.portionGram)
    });

    if (res.success) {
      setMessage("Food created.");
      setCreateForm(emptyFoodForm);
      await loadFoods();
    } else {
      setError(res.error ?? "Could not create food.");
    }
    setSaving(false);
  };

  const submitEdit = async (foodId: number) => {
    setSaving(true);
    setMessage(null);
    const res = await apiClient.put<Food>(`/admin/foods/${foodId}`, {
      calories: Number(editForm.calories),
      protein: Number(editForm.protein),
      carbs: Number(editForm.carbs),
      fat: Number(editForm.fat),
      portionGram: Number(editForm.portionGram)
    });

    if (res.success) {
      setMessage("Food updated.");
      setEditId(null);
      await loadFoods();
    } else {
      setError(res.error ?? "Could not update food.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Food dataset</CardTitle>
          <CardDescription>Add foods and update nutrition values used by diet plans.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={submitCreate}>
            <Input placeholder="Food name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Category" value={createForm.category} onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))} />
            <Input placeholder="Calories" type="number" step="0.1" value={createForm.calories} onChange={(e) => setCreateForm((p) => ({ ...p, calories: e.target.value }))} />
            <Input placeholder="Protein (g)" type="number" step="0.1" value={createForm.protein} onChange={(e) => setCreateForm((p) => ({ ...p, protein: e.target.value }))} />
            <Input placeholder="Carbs (g)" type="number" step="0.1" value={createForm.carbs} onChange={(e) => setCreateForm((p) => ({ ...p, carbs: e.target.value }))} />
            <Input placeholder="Fat (g)" type="number" step="0.1" value={createForm.fat} onChange={(e) => setCreateForm((p) => ({ ...p, fat: e.target.value }))} />
            <Input placeholder="Portion (g)" type="number" step="0.1" value={createForm.portionGram} onChange={(e) => setCreateForm((p) => ({ ...p, portionGram: e.target.value }))} />
            <Button type="submit" disabled={saving}>Add food</Button>
          </form>

          <div className="flex flex-wrap gap-3">
            <Input className="max-w-sm" placeholder="Search by food or category" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button variant="outline" onClick={() => void loadFoods()}>Search</Button>
          </div>

          {loading ? <p className="text-sm text-mutedForeground">Loading foods…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-primary">{message}</p> : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-mutedForeground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Calories</th>
                    <th className="px-3 py-2 font-medium">Protein</th>
                    <th className="px-3 py-2 font-medium">Carbs</th>
                    <th className="px-3 py-2 font-medium">Fat</th>
                    <th className="px-3 py-2 font-medium">Portion</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedFoods.map((food) => {
                    const isEditing = editId === food.id;
                    return (
                      <tr key={food.id} className="border-b border-border/60">
                        <td className="px-3 py-3 font-medium">{food.name}</td>
                        <td className="px-3 py-3">{food.category}</td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={editForm.calories} onChange={(e) => setEditForm((p) => ({ ...p, calories: e.target.value }))} />
                          ) : (
                            formatNumber(food.calories)
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={editForm.protein} onChange={(e) => setEditForm((p) => ({ ...p, protein: e.target.value }))} />
                          ) : (
                            formatNumber(food.protein)
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={editForm.carbs} onChange={(e) => setEditForm((p) => ({ ...p, carbs: e.target.value }))} />
                          ) : (
                            formatNumber(food.carbs)
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={editForm.fat} onChange={(e) => setEditForm((p) => ({ ...p, fat: e.target.value }))} />
                          ) : (
                            formatNumber(food.fat)
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <Input type="number" step="0.1" value={editForm.portionGram} onChange={(e) => setEditForm((p) => ({ ...p, portionGram: e.target.value }))} />
                          ) : (
                            `${formatNumber(food.portionGram)} g`
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => void submitEdit(food.id)} disabled={saving}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditId(food.id);
                                setEditForm({
                                  name: food.name,
                                  category: food.category,
                                  calories: String(food.calories),
                                  protein: String(food.protein),
                                  carbs: String(food.carbs),
                                  fat: String(food.fat),
                                  portionGram: String(food.portionGram)
                                });
                              }}
                            >
                              Edit nutrition
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
