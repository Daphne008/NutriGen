import { MEDIAGAN_INTRO } from "@/lib/studentOpportunities";

export function WorkspaceGuideContent() {
  return (
    <>
      <p className="text-sm text-mutedForeground">{MEDIAGAN_INTRO}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground">
        <li>
          On <strong>Dashboard</strong>, pick one or more patient categories (Pediatric and Geriatric cannot both be
          selected).
        </li>
        <li>Open the workspace: review the MediGAN profile, note differentials in the scratchpad, and tag pathologies.</li>
        <li>Add foods by meal slot, then submit your plan.</li>
        <li>Read dietary assessment and accuracy feedback on the evaluation screen.</li>
      </ol>
    </>
  );
}
