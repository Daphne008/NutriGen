"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteHeader, SiteHeaderAuthLinks } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AccountType = "DIETITIAN" | "PATIENT";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("DIETITIAN");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const result = await register(name, email, password, accountType);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace("/auth/login?registered=1");
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-mutedForeground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader rightSlot={<SiteHeaderAuthLinks />} />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Choose whether you are registering as a dietitian or a patient.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">Account type</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("DIETITIAN")}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      accountType === "DIETITIAN"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="block font-semibold">Dietitian</span>
                    <span className="mt-1 block text-xs text-mutedForeground">Plan and evaluate diets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("PATIENT")}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                      accountType === "PATIENT"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="block font-semibold">Patient</span>
                    <span className="mt-1 block text-xs text-mutedForeground">Patient account</span>
                  </button>
                </div>
              </fieldset>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="name">
                  Name
                </label>
                <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
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
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-mutedForeground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Log in
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
