"use client";

export function ClinicalScratchpad({
  notes,
  onNotesChange
}: {
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-muted/20 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
      <h4 className="text-sm font-semibold">Clinical Notes Scratchpad</h4>
      <textarea
        className="mt-3 min-h-[280px] flex-1 resize-y rounded-md border border-border bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:min-h-0"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Patient appears to have metabolic syndrome risk and requires sodium moderation..."
      />
    </aside>
  );
}
