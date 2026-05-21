"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverTip } from "@/components/HoverTip";
import { DASHBOARD_CATEGORIES, slugFromCategory } from "@/lib/categories";
import { CATEGORY_HOVER } from "@/lib/hoverContent";
import { CATEGORY_EXCLUSIVE_GROUPS, toggleWithExclusive } from "@/lib/pathologyRules";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function DashboardCategoryPicker() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => toggleWithExclusive(prev, id, CATEGORY_EXCLUSIVE_GROUPS));
  };

  const openWorkspace = () => {
    if (selectedIds.length === 0) return;
    const ordered = DASHBOARD_CATEGORIES.filter((c) => selectedSet.has(c.id));
    const primary = ordered[0];
    if (!primary) return;
    const extra = ordered
      .slice(1)
      .map((c) => c.id)
      .join(",");
    const slug = slugFromCategory(primary.routeCategory);
    const q = extra ? `?ctx=${encodeURIComponent(extra)}` : "";
    router.push(`/workspace/${slug}${q}`);
  };

  const selectedCategories = DASHBOARD_CATEGORIES.filter((c) => selectedSet.has(c.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select patient context</CardTitle>
        <CardDescription>
          Choose the clinical themes for this case. Tap a chip to turn it on or off. Pediatric and Geriatric cannot be
          combined. The first category you pick shapes the MediGAN patient profile; any others add overlapping context to
          the same case.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {DASHBOARD_CATEGORIES.map((c) => {
            const active = selectedSet.has(c.id);
            const hint = CATEGORY_HOVER[c.id] ?? c.description;
            return (
              <HoverTip key={c.id} content={hint}>
                <button
                  type="button"
                  onClick={() => toggleId(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {c.title}
                </button>
              </HoverTip>
            );
          })}
        </div>

        {selectedCategories.length > 0 && (
          <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            {selectedCategories.map((c) => (
              <li key={c.id} className="text-foreground">
                <span className="font-medium">{c.title}</span>
                <span className="text-mutedForeground">: {c.description}</span>
              </li>
            ))}
          </ul>
        )}

        <Button type="button" className="w-full sm:w-auto" disabled={selectedIds.length === 0} onClick={openWorkspace}>
          Open planning workspace
        </Button>
      </CardContent>
    </Card>
  );
}
