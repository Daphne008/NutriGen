"use client";

import { HoverTip } from "@/components/HoverTip";
import type { AccuracyFlag } from "@/lib/diagnosis";

const severityStyles: Record<AccuracyFlag["severity"], string> = {
  info: "border-yellow-300 bg-yellow-50 text-yellow-900",
  success: "border-green-300 bg-green-50 text-green-900",
  warning: "border-red-300 bg-red-50 text-red-900",
  error: "border-red-400 bg-red-50 text-red-950"
};

const severityBadge: Record<AccuracyFlag["severity"], string> = {
  info: "bg-yellow-200 text-yellow-900",
  success: "bg-green-200 text-green-900",
  warning: "bg-red-200 text-red-900",
  error: "bg-red-300 text-red-950"
};

function severityDisplayLabel(severity: AccuracyFlag["severity"]): string {
  return severity;
}

export function AccuracyFlagsPanel({
  flags,
  title = "Accuracy flags",
  description = "Checks against the patient profile and your diet plan. Hover a flag for detail.",
  emptyMessage = "No accuracy concerns detected for this plan."
}: {
  flags: AccuracyFlag[];
  title?: string;
  description?: string;
  emptyMessage?: string;
}) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
      <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
        {flags.length === 0 ? (
          <li className="font-mono text-[11px] text-slate-500">[none] {emptyMessage}</li>
        ) : (
          flags.map((flag) => (
            <li key={flag.id}>
              <HoverTip content={flag.hint} side="top">
                <span
                  className={`inline-flex w-full items-start gap-2 rounded-md border px-2.5 py-2 font-mono text-[11px] leading-relaxed ${severityStyles[flag.severity]}`}
                >
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${severityBadge[flag.severity]}`}>
                    {severityDisplayLabel(flag.severity)}
                  </span>
                  <span className="min-w-0 flex-1 text-left">{flag.message}</span>
                </span>
              </HoverTip>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
