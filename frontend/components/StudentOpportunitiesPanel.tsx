import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_CAPABILITIES } from "@/lib/studentOpportunities";

type OpportunityItem = { title: string; description: string };

export function StudentOpportunitiesPanel({
  title = "What you can practice",
  description = "Training opportunities available in this simulation",
  items = PLATFORM_CAPABILITIES
}: {
  title?: string;
  description?: string;
  items?: readonly OpportunityItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.title} className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-mutedForeground">{item.description}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
