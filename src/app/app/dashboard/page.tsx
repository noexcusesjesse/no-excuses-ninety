import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat, MoodPicker } from "@/app/client/_components";
import { MealWindowCard } from "@/app/client/meal-window-card";
import { getClientToday } from "@/db/queries";
import {
  HOME_ENVIRONMENTS,
  LOADLINE_30_WEEK,
  LOADLINE_FORMULA,
  SAFETY_LINE,
  blockLabel,
  formatPositionKicker,
  formatPositionSecondary,
  journeyProgress,
  type HomeEnvironment,
} from "@/lib/program-position";
import { Beef, Check, Droplet, Footprints, Moon } from "lucide-react";

export const dynamic = "force-dynamic";

const ENV_ORDER: HomeEnvironment[] = ["foundation", "strength", "condition", "recovery"];

export default async function DashboardPage() {
  const client = await getClientToday();
  if (!client) return <div className="py-12 text-center text-muted-foreground">Not signed in as a client.</div>;

  const pos = client.position;
  const journey = journeyProgress(pos);
  const secondary = formatPositionSecondary(pos);
  const blockTitle = blockLabel(pos.block);
  const isLoadLine30 = pos.block === "loadLine30";
  const isBootCamp = pos.block === "bootCamp";
  const todayEnv = client.plan.environment;
  const envMeta = HOME_ENVIRONMENTS[todayEnv];
  const metaLine = isBootCamp
    ? `Day ${pos.dayInBlock}/${pos.daysInBlock}`
    : isLoadLine30
      ? `Day ${pos.dayInBlock} of 30`
      : null;

  return (
    <>
      <section className="mb-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {formatPositionKicker(pos, client.plan.dayLabel)}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Good morning, {client.name}.
            </h1>
            {secondary && (
              <p className="mt-1 text-sm text-muted-foreground">{secondary}</p>
            )}
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Product</p>
            <p className="text-sm font-semibold">
              {blockTitle}
              {metaLine && (
                <span className="ml-2 font-mono text-xs text-muted-foreground">{metaLine}</span>
              )}
            </p>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          {LOADLINE_FORMULA}
        </p>
      </section>

      <Card className="mb-6">
        <CardContent className="flex items-center gap-6 pt-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" opacity="0.3" />
              <circle
                cx="48" cy="48" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(1, journey.percent / 100))}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-xl font-bold tabular-nums">{journey.percent}%</span>
              <span className="font-mono text-[9px] text-muted-foreground">{journey.label}</span>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Product</p>
              <p className="text-sm font-semibold leading-tight">{blockTitle}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Today</p>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {isLoadLine30
                  ? `${pos.dayInBlock}/30`
                  : isBootCamp
                    ? `${pos.dayInBlock}/14`
                    : blockTitle}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Current</p>
              <p className="font-mono text-lg font-semibold tabular-nums">—lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Lost</p>
              <p className="font-mono text-lg font-semibold text-success tabular-nums">—</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Beef} label="Protein" value={client.proteinToday} target={client.proteinTarget} unit="g" />
        <Stat icon={Droplet} label="Hydration" value={client.hydrationOz} target={client.hydrationTarget} unit=" oz" />
        <Stat icon={Footprints} label="Walk" value={client.plan.walkMinutes} target={client.plan.walkMinutes} unit=" min" />
        <Stat icon={Moon} label="Sleep" value={client.sleepHours} target={8} unit="h" />
      </section>

      <section className="mb-6">
        <MealWindowCard />
      </section>

      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>If something feels off</CardTitle>
            <CardDescription>Not medical advice.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{SAFETY_LINE}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>HOME · {envMeta.label}</CardTitle>
          <CardDescription>
            Four environments as HOME labels — not facility pods. {envMeta.hint}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ENV_ORDER.map((key) => {
              const env = HOME_ENVIRONMENTS[key];
              const active = key === todayEnv;
              return (
                <div
                  key={key}
                  className={`rounded-md border px-3 py-2 ${
                    active ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <p className="text-sm font-semibold">{env.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] leading-snug text-muted-foreground">{env.hint}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <CardHeader className="border-b border-border bg-gradient-to-r from-primary/15 via-primary/5 to-transparent">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>
                {isBootCamp
                  ? "Boot Camp analog"
                  : isLoadLine30 && client.plan.isDay1Calibration
                    ? "Day 1 · Band calibration + Foundation + walk"
                    : `Today · ${envMeta.label}`}
              </CardTitle>
              <CardDescription className="mt-1">
                {isBootCamp
                  ? "Already done. Not Basic Training. Not Base Camp. LoadLine 30 starts Sep 1."
                  : client.plan.extra || envMeta.hint}
              </CardDescription>
            </div>
            {!isBootCamp && (
              <Button size="lg" className="shadow-glow shrink-0">Start {envMeta.label}</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {isBootCamp ? (
            <p className="text-sm text-muted-foreground">
              Aug 18–31 was the Boot Camp analog. Tomorrow is LoadLine 30 Day 1 — Foundation + walk, not a hero Strength session.
            </p>
          ) : (
            <>
              <p className="text-sm">
                <span className="font-medium">{envMeta.label}.</span>{" "}
                {envMeta.hint}. {client.plan.walkNote}.
                {client.plan.stretchMinutes > 0 ? ` ${client.plan.stretchMinutes} min stretch.` : ""}
                {client.plan.isWeighIn ? " Sunday weigh-in (weight/waist)." : ""}
              </p>
              {client.plan.isDay1Calibration && (
                <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  Band calibration, then Foundation + walk. Not a hero Strength session.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s walk</CardTitle>
            <CardDescription>{client.plan.walkNote}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary"><Footprints className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="font-mono text-2xl font-semibold tabular-nums">{client.plan.walkMinutes} min</p>
                <p className="font-mono text-[11px] text-muted-foreground">{client.plan.walkNote}</p>
              </div>
              <Button variant="outline">Log</Button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className={`h-6 rounded-sm ${i < client.walkStreak ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">{client.walkStreak}-day walk streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick check-in</CardTitle>
            <CardDescription>One tap. Five seconds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Mood</p>
              <MoodPicker />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Energy</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card font-mono text-sm transition-colors hover:border-primary hover:bg-accent">{n}</button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <CardDescription>
            {isLoadLine30
              ? "LoadLine 30 week shape — signed packet, not a 365-day calendar"
              : isBootCamp
                ? "Boot Camp analog · LoadLine 30 week shape starts Sep 1"
                : `${blockTitle} · weekday shape from LoadLine 30`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {LOADLINE_30_WEEK.map((d) => {
              const isToday = d.dayLabel === client.plan.dayLabel;
              return (
                <div
                  key={d.dayLabel}
                  className={`flex flex-col gap-1 rounded-md border p-2 ${
                    isToday ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">{d.dayLabel}</span>
                  <span className="text-xs font-semibold">{HOME_ENVIRONMENTS[d.environment].label}</span>
                  <span className="font-mono text-[10px] leading-snug text-muted-foreground">{d.walkNote}</span>
                  {isToday && <Check className="h-3 w-3 text-primary" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
