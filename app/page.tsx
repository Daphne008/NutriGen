import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-primary">NutriGen</span>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Clinical nutrition workspace</p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Evidence-based diet plans with AI-style patient reports
              </h1>
              <p className="text-lg text-mutedForeground">
                Simulate patient profiles by category, build meals with live macro feedback, compare food equivalences, and
                review plans with clear scores and charts—built for dietitians and teaching demos.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/auth/register">Get started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            </div>
            <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/40">
              <CardHeader>
                <CardTitle className="text-primary">Sample diet snapshot</CardTitle>
                <CardDescription>Static preview of what you will see after planning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-mutedForeground">Target kcal</p>
                    <p className="text-2xl font-semibold">2,050</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-mutedForeground">Plan score</p>
                    <p className="text-2xl font-semibold text-primary">88</p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[72%] rounded-full bg-primary" />
                </div>
                <p className="text-xs text-mutedForeground">
                  Macros align within ±10% of simulated patient targets; suggestions highlight gaps before you save.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-10 text-2xl font-semibold text-foreground">Platform features</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">GAN-like reports</CardTitle>
                  <CardDescription>
                    Category-driven patient snapshots with BMI, glucose, risks, and macro targets for teaching scenarios.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equivalence-aware planning</CardTitle>
                  <CardDescription>
                    Swap suggestions from your dataset help keep portions realistic across food groups.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Charts & scoring</CardTitle>
                  <CardDescription>
                    Macro distribution and calorie comparison charts summarize how close the plan is to goals.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center md:p-12">
            <h2 className="text-2xl font-semibold text-foreground">Ready to open the workspace?</h2>
            <p className="mt-2 text-mutedForeground">Create a dietitian account and start from the dashboard.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link href="/auth/register">Create account</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-mutedForeground">
        Dietitian Support Platform — university demo build
      </footer>
    </div>
  );
}
