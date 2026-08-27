import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeightHistory, getClientProfile, getClientToday } from "@/db/queries";
import { WeightChart } from "./weight-chart";
import { formatPositionKicker, formatPositionSecondary } from "@/lib/program-position";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const history = await getWeightHistory();
  const profile = await getClientProfile();
  const today = await getClientToday();
  if (!profile || !today) return <div className="py-12 text-center text-muted-foreground">Not signed in as a client.</div>;

  const goalWeight = 200; // TODO: add goalWeight to client profile
  const latestWeight = history[history.length - 1]?.weightLb ?? profile.startWeightLb;
  const totalLost = Math.round((profile.startWeightLb - latestWeight) * 10) / 10;
  const latestWaist = history[history.length - 1]?.waistIn ?? null;

  // Waist-to-height ratio
  let waistToHeight: number | null = null;
  let waistCategory = "";
  let waistVariant: "good" | "warn" | "bad" = "good";
  if (latestWaist && profile.heightIn) {
    waistToHeight = Math.round((latestWaist / profile.heightIn) * 100) / 100;
    if (waistToHeight < 0.4) { waistCategory = "Low"; waistVariant = "good"; }
    else if (waistToHeight <= 0.5) { waistCategory = "Healthy range"; waistVariant = "good"; }
    else if (waistToHeight <= 0.6) { waistCategory = "Increased risk"; waistVariant = "warn"; }
    else { waistCategory = "High risk"; waistVariant = "bad"; }
  }

  // Milestones (auto-generated every ~10-15 lbs)
  const milestones: { weight: number; achieved: boolean }[] = [];
  for (let w = profile.startWeightLb; w >= goalWeight; w -= 10) {
    milestones.push({ weight: Math.round(w), achieved: latestWeight <= w });
  }

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {formatPositionKicker(today.position, today.plan.dayLabel)}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Progress</h1>
        {formatPositionSecondary(today.position) && (
          <p className="mt-1 text-sm text-muted-foreground">{formatPositionSecondary(today.position)}</p>
        )}
      </div>

      {/* Weekly check-in card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Weekly Check-In</CardTitle>
          <CardDescription>Rolling 7-day window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Start</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{profile.startWeightLb} lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Current</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{latestWeight} lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Lost</p>
              <p className="font-mono text-lg font-semibold text-success tabular-nums">{totalLost > 0 ? `-${totalLost}` : "0"} lb</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Goal</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{goalWeight} lb</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weight trend chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Weight Trend</CardTitle>
          <CardDescription>Daily weight (thin) + goal reference (dashed)</CardDescription>
        </CardHeader>
        <CardContent>
          <WeightChart data={history} goalWeight={goalWeight} />
        </CardContent>
      </Card>

      {/* Waist & visceral fat proxy */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Waist &amp; Height Ratio</CardTitle>
          <CardDescription>Educational proxy — not a diagnostic measurement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Waist</p>
              <p className="font-mono text-2xl font-semibold tabular-nums">{latestWaist ? `${latestWaist}"` : "—"}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Waist/Height</p>
              <p className="font-mono text-2xl font-semibold tabular-nums">{waistToHeight ?? "—"}</p>
            </div>
          </div>
          {waistCategory && (
            <div className={`rounded-md border px-3 py-2 text-sm ${
              waistVariant === "good" ? "border-success/30 bg-success/10 text-success" :
              waistVariant === "warn" ? "border-warning/30 bg-warning/10 text-warning" :
              "border-destructive/30 bg-destructive/10 text-destructive"
            }`}>
              {waistCategory}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Trend direction matters more than any single reading. This is an educational proxy, not a DEXA/CT scan.
          </p>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Auto-generated targets from start weight to goal</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`rounded-full border px-3 py-1.5 font-mono text-sm tabular-nums ${
                m.achieved ? "border-success bg-success/10 text-success" : "border-border bg-card text-muted-foreground"
              }`}
            >
              {m.weight} lb {m.achieved && "✓"}
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
