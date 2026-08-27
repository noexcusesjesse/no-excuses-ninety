import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat, MoodPicker } from "./_components";
import { FastingCard } from "./fasting-card";
import { getClientToday, type WorkoutLetter } from "@/db/queries";
import { formatPositionKicker, formatPositionSecondary, blockLabel } from "@/lib/program-position";
import { Beef, Check, Circle, Droplet, Dumbbell, Footprints, Moon } from "lucide-react";
import Link from "next/link";

const WORKOUT_A = [
  { name: "Sit-to-stand / squat", reps: "8–12", band: "bodyweight → medium" },
  { name: "Door-anchor chest press", reps: "10–12", band: "light" },
  { name: "Door-anchor row", reps: "10–12", band: "medium" },
  { name: "Glute bridge", reps: "10–15", band: "bodyweight → light/medium" },
  { name: "Face pull or pull-apart", reps: "12–15", band: "light" },
  { name: "Dead bug", reps: "6–8/side", band: "no band / lightest" },
];
const WORKOUT_B = [
  { name: "Sit-to-stand", reps: "8–12", band: "bodyweight → medium" },
  { name: "Band Romanian deadlift", reps: "10–12", band: "medium or heavy" },
  { name: "Ankle-strap kickback", reps: "10/side", band: "light" },
  { name: "Incline or knee push-up", reps: "6–12", band: "no band" },
  { name: "Door-anchor face pull", reps: "12–15", band: "light" },
  { name: "Bird-dog", reps: "6–8/side", band: "no band" },
];
function getWorkout(letter: WorkoutLetter) { return letter === "A" ? WORKOUT_A : letter === "B" ? WORKOUT_B : []; }

// DB-backed — must be evaluated per request, not prerendered.
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
  const exercises = getWorkout(client.plan.workout);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Last 6 calendar days (rough — Sprint 2 will align to week boundaries)
  const weekDone = [true, true, true, true, false, false];

  return (
    <>
      <AppHeader role="client" />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        <section className="mb-8">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {formatPositionKicker(client.position, client.plan.dayLabel)}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                Good morning, {client.name}.
              </h1>
              {formatPositionSecondary(client.position) && (
                <p className="mt-1 text-sm text-muted-foreground">{formatPositionSecondary(client.position)}</p>
              )}
            </div>
            <div className="hidden text-right sm:block">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Block</p>
              <p className="text-sm font-semibold">
                {blockLabel(client.position.block)}
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {client.position.programMonth ? `Month ${client.position.programMonth}/15` : `Day ${client.position.dayInBlock}/${client.position.daysInBlock}`}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Beef} label="Protein" value={client.proteinToday} target={client.proteinTarget} unit="g" />
          <Stat icon={Droplet} label="Hydration" value={client.hydrationOz} target={client.hydrationTarget} unit=" oz" />
          <Stat icon={Footprints} label="Steps" value={client.stepsToday} target={client.stepsTarget} unit="" />
          <Stat icon={Moon} label="Sleep" value={client.sleepHours} target={8} unit="h" />
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <FastingCard />
        </section>

        <Card className="mb-6 overflow-hidden">
          <CardHeader className="border-b border-border bg-gradient-to-r from-primary/15 via-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today · Workout {client.plan.workout}</CardTitle>
                <CardDescription className="mt-1">
                  {client.plan.isDeload ? "Deload week — 1 round, lightest bands" : "2 rounds · rest 45–75s between sets"}
                </CardDescription>
              </div>
              <Button size="lg" className="shadow-glow"><Dumbbell className="h-4 w-4" />Start workout</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ol className="divide-y divide-border">
              {exercises.map((ex, i) => (
                <li key={ex.name} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{ex.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{ex.reps} reps · {ex.band}</p>
                  </div>
                  <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Mark complete">
                    <Circle className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s walk</CardTitle>
              <CardDescription>
                {client.plan.isFastedWalk ? "60-min fasted walk — break fast with protein on return" : `${client.plan.walkMinutes}-min outdoor walk`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary"><Footprints className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="font-mono text-2xl font-semibold tabular-nums">{client.stepsToday.toLocaleString()}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">of {client.stepsTarget.toLocaleString()} target</p>
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
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Moon className="h-3.5 w-3.5" />CPAP last night</div>
                <span className="font-mono text-sm tabular-nums">{client.cpapHours}h</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="mt-6">
          <CardHeader><CardTitle>This week</CardTitle><CardDescription>{blockLabel(client.position.block)}</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {weekDays.map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-1 rounded-md border border-border bg-card p-2">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">{d}</span>
                  <div className={`h-5 w-5 rounded-full ${weekDone[i] ? "bg-success" : "bg-muted"} flex items-center justify-center`}>
                    {weekDone[i] && <Check className="h-3 w-3 text-success-foreground" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
