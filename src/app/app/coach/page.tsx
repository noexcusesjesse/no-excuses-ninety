import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientToday, getCycleData } from "@/db/queries";
import { CoachChat } from "./coach-chat";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const client = await getClientToday();
  const cycle = await getCycleData();
  if (!client || !cycle) return <div className="py-12 text-center text-muted-foreground">Not signed in as a client.</div>;

  // Build context summary for the AI coach
  const context = {
    name: client.name,
    programDay: client.programDay,
    phase: client.phase,
    weekNumber: client.weekNumber,
    proteinToday: client.proteinToday,
    proteinTarget: client.proteinTarget,
    hydrationOz: client.hydrationOz,
    stepsToday: client.stepsToday,
    sleepHours: client.sleepHours,
    cpapHours: client.cpapHours,
    mood: client.mood,
    energy: client.energy,
    cycle: {
      startWeight: cycle.startWeight,
      currentWeight: cycle.currentWeight,
      weightChange: cycle.weightChange,
      avgProtein: cycle.avgProtein,
      avgSteps: cycle.avgSteps,
      exerciseSessions: cycle.exerciseSessions,
      proteinAdherencePct: cycle.proteinAdherencePct,
      stepsAdherencePct: cycle.stepsAdherencePct,
    },
  };

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {client.plan.dayLabel} · Day {client.programDay} of 90
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Coach</h1>
        <p className="mt-2 text-sm text-muted-foreground">Data-grounded AI coach. Knows your numbers, not your diagnosis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat with your coach</CardTitle>
          <CardDescription>
            This coach only knows your logged data. It never gives medication advice, diagnoses, or guarantees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachChat contextData={context} />
        </CardContent>
      </Card>

      <div className="mt-6 rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold">Safety rules:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Never gives medication dosing, timing, or schedule advice — see your prescribing clinician</li>
          <li>Never diagnoses or interprets symptoms, labs, or vitals</li>
          <li>Never recommends extreme or drastic calorie restriction</li>
          <li>Never guarantees results or promises a specific date</li>
          <li>Keep replies short (2-4 sentences) unless more detail is clearly wanted</li>
        </ul>
      </div>
    </>
  );
}
