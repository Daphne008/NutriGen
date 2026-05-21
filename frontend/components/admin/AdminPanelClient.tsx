"use client";

import { AdminDietPlansTab } from "@/components/admin/AdminDietPlansTab";
import { AdminEquivalencesTab } from "@/components/admin/AdminEquivalencesTab";
import { AdminFoodsTab } from "@/components/admin/AdminFoodsTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";

type AdminTabId = "users" | "foods" | "equivalences" | "diet-plans" | "reports";

const tabs: Array<{ id: AdminTabId; label: string }> = [
  { id: "users", label: "Users" },
  { id: "foods", label: "Food dataset" },
  { id: "equivalences", label: "Equivalence table" },
  { id: "diet-plans", label: "Diet plans" },
  { id: "reports", label: "Reports" }
];

export function AdminPanelClient() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("users");

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case "users":
        return <AdminUsersTab />;
      case "foods":
        return <AdminFoodsTab />;
      case "equivalences":
        return <AdminEquivalencesTab />;
      case "diet-plans":
        return <AdminDietPlansTab />;
      case "reports":
        return <AdminReportsTab />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin panel</h1>
        <p className="mt-2 text-mutedForeground">
          Manage users, nutrition data, equivalence rules, diet plans, and generated reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {activeContent}
    </div>
  );
}
