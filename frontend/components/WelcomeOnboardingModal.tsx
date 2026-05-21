"use client";

import { Button } from "@/components/ui/button";
import { WorkspaceGuideContent } from "@/components/WorkspaceGuideContent";
import { useEffect, useState } from "react";

/** Dismiss only for this browser tab session — not permanent across visits. */
const SESSION_KEY = "nutrigen_onboarding_session_dismissed";
const LEGACY_STORAGE_KEY = "nutrigen_onboarding_dismissed";

export function WelcomeOnboardingModal() {
  const [open, setOpen] = useState(false);
  const [hideForSession, setHideForSession] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    setOpen(true);
  }, []);

  function dismiss() {
    if (hideForSession && typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 id="onboarding-title" className="text-xl font-semibold text-foreground">
          What this is for &amp; how to use the workspace
        </h2>
        <WorkspaceGuideContent />
        <p className="mt-4 text-xs text-mutedForeground">
          The same guide is always available on your Dashboard after you close this window.
        </p>
        <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-mutedForeground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={hideForSession}
            onChange={(e) => setHideForSession(e.target.checked)}
          />
          Don&apos;t show it again
        </label>
        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={dismiss}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
