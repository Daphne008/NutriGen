import { Button } from "@/components/ui/button";
import { SocialLinks } from "@/components/SocialLinks";
import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({
  rightSlot
}: {
  rightSlot?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          NutriGen
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <SocialLinks />
          {rightSlot}
        </div>
      </div>
    </header>
  );
}

export function SiteHeaderAuthLinks() {
  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/login">Log in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/auth/register">Register</Link>
      </Button>
    </>
  );
}
