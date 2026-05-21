"use client";

import { Button } from "@/components/ui/button";
import type { PathologyOption } from "@/lib/diagnosis";
import { PATHOLOGY_EXCLUSIVE_GROUPS, toggleWithExclusive } from "@/lib/pathologyRules";
import { VITAL_CATEGORY_LABELS } from "@/lib/vitalPathologyCategories";

export function DiagnosticPathologyPopup({
  category,
  options,
  selectedPathologies,
  onPathologiesChange,
  onClose,
  style
}: {
  category: string;
  options: readonly PathologyOption[];
  selectedPathologies: PathologyOption[];
  onPathologiesChange: (next: PathologyOption[]) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}) {
  const title = VITAL_CATEGORY_LABELS[category] ?? "Assign pathologies";

  function onCheckboxChange(option: PathologyOption, checked: boolean) {
    if (checked) {
      onPathologiesChange(toggleWithExclusive(selectedPathologies, option, PATHOLOGY_EXCLUSIVE_GROUPS));
    } else {
      onPathologiesChange(selectedPathologies.filter((p) => p !== option));
    }
  }

  return (
    <div
      className="diagnostic-popup absolute z-50 min-w-[220px] rounded-md border border-border bg-card p-3 shadow-lg"
      style={style}
      role="dialog"
      aria-label={`${title} pathologies`}
    >
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-[11px] text-mutedForeground">Select all that apply. Nothing is added until you check a box.</p>
      <div className="popup-options mt-2 flex flex-col gap-1.5">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-start gap-2 text-xs text-foreground hover:text-primary"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5 rounded border-border"
              checked={selectedPathologies.includes(opt)}
              onChange={(e) => onCheckboxChange(opt, e.target.checked)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
