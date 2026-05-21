"use client";

import type { ReactNode } from "react";

export function HoverTip({
  content,
  children,
  side = "top"
}: {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  return (
    <span className="group relative inline-flex max-w-full cursor-help align-middle">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 hidden w-64 rounded-md border border-border bg-slate-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-lg group-hover:block group-focus-within:block ${
          side === "top" ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "top-full left-1/2 mt-2 -translate-x-1/2"
        }`}
      >
        {content}
      </span>
    </span>
  );
}
