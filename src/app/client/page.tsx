import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat, MoodPicker } from "./_components";
import { MealWindowCard } from "./meal-window-card";
import { getClientToday } from "@/db/queries";
import {
  HOME_ENVIRONMENTS,
  LOADLINE_FORMULA,
  SAFETY_LINE,
  blockLabel,
  formatPositionKicker,
  formatPositionSecondary,
} from "@/lib/program-position";
import { Beef, Droplet, Footprints, Moon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const client = await getClientToday();
  if (!client) {
    return (
      <>
        <AppHeader role="client" />
        <main className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">
          <p>Not signed in as a client.</p>
          <p className="mt-2">
            <Link href="/login" className="text-primary underline">Sign in</Link>
            {" "}or run <code className="font-mono">npm run db:seed</code> to create demo data.
          </p>
        </main>
      </>
    );
  }

  const pos = client.position;
  const envMeta = HOME_ENVIRONMENTS[client.plan.environment];

  return (
    <>
      <AppHeader role="client" />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        <section className="mb-8">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {formatPositionKicker(pos, client.plan.dayLabel)}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                Good morning, {client.name}.
              </h1>
              {formatPositionSecondary(pos) && (
                <p className="mt-1 text-sm text-muted-foreground">{formatPositionSecondary(pos)}</p>
              )}
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                {LOADLINE_FORMULA}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Product</p>
              <p className="text-sm font-semibold">
                {blockLabel(pos.block)}
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {pos.block === "loadLine30"
                    ? `Day ${pos.dayInBlock}/30`
                    : pos.block === "bootCamp"
                      ? `Day ${pos.dayInBlock}/${pos.daysInBlock}`
                      : ""}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Beef} label="Protein" value={client.proteinToday} target={client.proteinTarget} unit="g" />
          <Stat icon={Droplet} label="Hydration" value={client.hydrationOz} target={client.hydrationTarget} unit=" oz" />
          <Stat icon={Footprints} label="Walk" value={client.plan.walkMinutes} target={client.plan.walkMinutes} unit=" min" />
          <Stat icon={Moon} label="Sleep" value={client.sleepHours} target={8} unit="h" />
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <MealWindowCard />
          <Card>
            <CardHeader>
              <CardTitle>If something feels off</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{SAFETY_LINE}</p>
            </CardContent>
          </Card>
        </section>

        <Card className="mb-6 overflow-hidden">
          <CardHeader className="border-b border-border bg-gradient-to-r from-primary/15 via-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today · {envMeta.label}</CardTitle>
                <CardDescription className="mt-1">
                  {client.plan.isDay1Calibration
                    ? "Band calibration, then Foundation + walk. Not a hero Strength session."
                    : envMeta.hint}
                </CardDescription>
              </div>
              <Button size="lg" className="shadow-glow">Start {envMeta.label}</Button>
            </div>
          </CardHeader>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Client house is at <Link href="/app/dashboard" className="text-primary underline">/app</Link>.
        </p>
      </main>
    </>
  );
}
