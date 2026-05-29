import { DashboardCategoryPicker } from "@/components/DashboardCategoryPicker";
import { WorkspaceGuidePanel } from "@/components/WorkspaceGuidePanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MEDIAGAN_INTRO, PLATFORM_CAPABILITIES } from "@/lib/studentOpportunities";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-mutedForeground">{MEDIAGAN_INTRO}</p>
      </div>

      <WorkspaceGuidePanel />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What you can do here</CardTitle>
          <CardDescription>
            Start a case on the Dashboard, then move through the workspace and evaluation flow below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PLATFORM_CAPABILITIES.map((item) => (
              <li key={item.title} className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-mutedForeground">{item.description}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <DashboardCategoryPicker />
    </div>
  );
}
