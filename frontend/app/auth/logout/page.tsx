"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      await logout();
      router.replace("/");
    })();
  }, [logout, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-mutedForeground">Signing you out…</p>
    </div>
  );
}
