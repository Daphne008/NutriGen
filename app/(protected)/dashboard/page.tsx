import { DASHBOARD_CATEGORIES, slugFromCategory } from "@/lib/categories";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Patient categories</h1>
        <p className="mt-2 text-mutedForeground">
          Choose a category to generate a simulated patient report and open the diet planning workspace.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_CATEGORIES.map(({ id, routeCategory, title, description }) => (
          <Link key={id} href={`/workspace/${slugFromCategory(routeCategory)}`} className="group block">
            <Card className="h-full transition-shadow group-hover:border-primary/40 group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-primary group-hover:underline">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
