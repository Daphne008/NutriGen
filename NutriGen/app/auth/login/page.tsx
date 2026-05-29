"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StudentOpportunitiesPanel } from "@/components/StudentOpportunitiesPanel";
import { SiteHeader, SiteHeaderAuthLinks } from "@/components/SiteHeader";
import { MEDIAGAN_INTRO } from "@/lib/studentOpportunities";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function readLoginQuery() {
  if (typeof window === "undefined") {
    return { registered: false, nextPath: "/dashboard" as string };
  }
  const params = new URLSearchParams(window.location.search);
  const nextRaw = params.get("next");
  const nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";
  return { registered: params.get("registered") === "1", nextPath };
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [registered, setRegistered] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = readLoginQuery();
    setRegistered(q.registered);
    setNextPath(q.nextPath);
  }, []);

  useEffect(() => {
    if (user) {
      router.replace(nextPath);
    }
  }, [user, router, nextPath]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace(nextPath);
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-mutedForeground">Signing you in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader rightSlot={<SiteHeaderAuthLinks />} />
      <div className="mx-auto grid max-w-5xl items-start gap-8 px-4 py-12 lg:grid-cols-2">
        <div className="hidden space-y-4 lg:block">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">MediGAN-based training</p>
          <p className="text-sm text-mutedForeground">{MEDIAGAN_INTRO}</p>
          <StudentOpportunitiesPanel
            title="What you can do after sign-in"
            description="Overview of the teaching workflow—details appear on your Dashboard once you log in."
          />
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Use your credentials to access the NutriGen workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {registered && (
              <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                Account created. You can sign in now.
              </p>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-mutedForeground">
              No account?{" "}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Register
              </Link>
            </p>
            <p className="mt-2 text-center text-sm">
              <Link href="/" className="text-mutedForeground hover:text-foreground">
                ← Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
