"use client";

import { AppTopNav } from "@/components/AppTopNav";
import { WelcomeOnboardingModal } from "@/components/WelcomeOnboardingModal";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function roleLabel(role: string): string {
  if (role === "PATIENT") return "Patient";
  if (role === "DIETITIAN") return "Dietitian";
  return role;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname ?? "/dashboard")}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-mutedForeground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="text-lg font-semibold text-primary">
              NutriGen
            </Link>
            <AppTopNav showAdmin={user.role === "ADMIN"} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-mutedForeground">
              {user.name} <span className="text-xs">({roleLabel(user.role)})</span>
            </span>
            <SocialLinks />
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/logout">Log out</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
      <WelcomeOnboardingModal />
    </div>
  );
}
