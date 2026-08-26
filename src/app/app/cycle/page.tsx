import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCycleData, getClientProfile, getClientToday } from "@/db/queries";
import { runDecisionEngine, computeWeeklyRate, calculateBMR, calculateTDEE, projectWeeksToGoal } from "@/lib/decision-engine";

export const dynamic = "force-dynamic";

export default async function CyclePage() {
  const cycle = await getCycleData();
  const profile = await getClientProfile();
  const today = await getClientToday();
  if (!cycle || !profile || !today) return <div className="py-12 text-center text-muted-foreground">Not signed in as a client.</div>;

  const decision = runDecisionEngine(cycle);
  const weeklyRate = computeWeeklyRate(cycle);
  const goalWeight = 200; // TODO: from profile

  // Goal projection
  const weeksToGoal = projectWeeksToGoal(cycle.currentWeight, goalWeight, weeklyRate);

  // BMR/TDEE (if we have the data)
  let bmr: number | null = null;
  let tdee: number | null = null;
  if (profile.heightIn && profile.ageYears) {
    bmr = calculateBMR(profile.currentWeightLb, profile.heightIn, profile.ageYears, "male");
    tdee = calculateTDEE(bmr, 1.3); // default activity level
  }

  const variantClasses = {
    good: "border-success/30 bg-success/10 text-success",
    warn: "border-warning/30 bg-warning/10 text-warning",
    bad: "border-destructive/30 bg-destructive/10 text-destructive",
  };

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {today.plan.dayLabel} · Day {today.programDay} of 90
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Cycle</h1>
      </div>

      {/* Cycle progress bar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>30-Day Cycle Progress</CardTitle>
          <CardDescription>Day {cycle.daysInCycle} of 90</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (cycle.daysInCycle / 90) * 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Start</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.startWeight} lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Current</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.currentWeight} lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Change</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.weightChange > 0 ? "+" : ""}{cycle.weightChange} lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Weekly Rate</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{weeklyRate > 0 ? "+" : ""}{weeklyRate.toFixed(1)} lb/wk</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core stats grid */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Cycle Stats</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Avg Protein</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.avgProtein ?? "—"} g</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Avg Steps</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.avgSteps?.toLocaleString() ?? "—"}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Workouts</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.exerciseSessions}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Logged Days</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.loggedDays}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adherence chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="rounded-full border border-border bg-card px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Protein </span>
          <span className="font-mono text-sm font-semibold tabular-nums">{cycle.proteinAdherencePct}%</span>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Steps </span>
          <span className="font-mono text-sm font-semibold tabular-nums">{cycle.stepsAdherencePct}%</span>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Fasting </span>
          <span className="font-mono text-sm font-semibold tabular-nums">{cycle.fastingAdherencePct}%</span>
        </div>
      </div>

      {/* 30-Day Decision Engine */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>30-Day Decision Engine</CardTitle>
          <CardDescription>Based on logged data — informs, doesn&apos;t act unilaterally</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`rounded-lg border p-4 ${variantClasses[decision.variant]}`}>
            <p className="font-mono text-[10px] uppercase tracking-wide">{decision.label}</p>
            <p className="mt-2 text-sm">{decision.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Goal projection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Goal Projection</CardTitle>
          <CardDescription>Estimate only — never a promised date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Current</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{cycle.currentWeight} lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Goal</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{goalWeight} lb</p>
            </div>
          </div>
          <p className="mt-3 text-sm">
            {weeksToGoal ? (
              <>Estimated <strong className="text-primary">{weeksToGoal} weeks</strong> to reach goal at current rate.</>
            ) : (
              <span className="text-muted-foreground">Need sustained weight loss to project a date.</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Calorie calculator */}
      {bmr && tdee && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Calorie Calculator</CardTitle>
            <CardDescription>Mifflin-St Jeor BMR × activity multiplier — estimate, not a prescription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">BMR</p>
                <p className="font-mono text-lg font-semibold tabular-nums">{bmr} cal</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">TDEE</p>
                <p className="font-mono text-lg font-semibold tabular-nums">{tdee} cal</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Target Range</p>
                <p className="font-mono text-lg font-semibold tabular-nums">{tdee - 500}–{tdee - 300}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Est. Deficit</p>
                <p className="font-mono text-lg font-semibold tabular-nums">~400 cal</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              These are educational estimates, not medical prescriptions. Consult your physician before changing your diet.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
