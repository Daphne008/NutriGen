import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader, SiteHeaderAuthLinks } from "@/components/SiteHeader";
import { MEDIAGAN_INTRO, PLATFORM_CAPABILITIES } from "@/lib/studentOpportunities";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader rightSlot={<SiteHeaderAuthLinks />} />

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Clinical nutrition simulation</p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Master clinical nutrition with MediGAN-based patient profiles
              </h1>
              <p className="text-lg text-mutedForeground">{MEDIAGAN_INTRO}</p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/auth/register">Create account</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Log in</Link>
                </Button>
              </div>
            </div>

            <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/40">
              <CardHeader>
                <CardTitle className="text-primary">What students can practice</CardTitle>
                <CardDescription>Capabilities built into the NutriGen workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {PLATFORM_CAPABILITIES.map((item) => (
                    <li key={item.title} className="rounded-lg border border-border bg-card/80 p-3">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-mutedForeground">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-mutedForeground">
        NutriGen — university teaching build
      </footer>
    </div>
  );
}
