"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppTopNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const dashboardActive = pathname === "/dashboard" || pathname.startsWith("/workspace");

  return (
    <nav className="flex flex-wrap items-center gap-1 sm:gap-4">
      <Link
        href="/dashboard"
        className={`text-sm font-medium transition-colors ${
          dashboardActive ? "text-primary" : "text-mutedForeground hover:text-foreground"
        }`}
      >
        Dashboard
      </Link>
      {showAdmin ? (
        <Link
          href="/admin"
          className={`text-sm font-medium transition-colors ${
            pathname.startsWith("/admin") ? "text-primary" : "text-mutedForeground hover:text-foreground"
          }`}
        >
          Admin
        </Link>
      ) : null}
    </nav>
  );
}
