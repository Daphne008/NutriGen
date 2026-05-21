import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceGuideContent } from "@/components/WorkspaceGuideContent";

/** Always visible on the dashboard so workspace instructions are never lost. */
export function WorkspaceGuidePanel() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg">What this is for &amp; how to use the workspace</CardTitle>
        <CardDescription>This guide stays here every time you sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <WorkspaceGuideContent />
      </CardContent>
    </Card>
  );
}
