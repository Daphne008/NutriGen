"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { useEffect, useState } from "react";
import { formatDate } from "./admin-utils";

export function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<AdminUser[]>("/admin/users");
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        setError(res.error ?? "Could not load users.");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>All registered platform accounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-mutedForeground">Loading users…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-mutedForeground">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Reports</th>
                  <th className="px-3 py-2 font-medium">Diet plans</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60">
                    <td className="px-3 py-3 font-medium">{user.name}</td>
                    <td className="px-3 py-3">{user.email}</td>
                    <td className="px-3 py-3">
                      <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                    </td>
                    <td className="px-3 py-3">{user._count.reports}</td>
                    <td className="px-3 py-3">{user._count.dietPlans}</td>
                    <td className="px-3 py-3 text-mutedForeground">{formatDate(user.createdAt)}</td>
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
