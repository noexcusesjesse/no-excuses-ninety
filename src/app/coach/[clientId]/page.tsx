import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientDetail, getDaysAgoLabel } from "@/db/queries";
import { getAssignedThread } from "@/db/messages";
import { MessageThread } from "@/components/message-thread";
import { ArrowLeft, Download, TrendingDown, TrendingUp } from "lucide-react";
import { NotesPanel } from "./notes-panel";
import { BandCalibrationPanel } from "./band-calibration-panel";
import { WeightChart } from "../weight-chart";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const detail = await getClientDetail(params.clientId);
  const thread = detail ? await getAssignedThread(params.clientId) : null;

  if (!detail) {
    return (
      <>
        <AppHeader role="coach" />
        <main className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">
          <p>Client not found.</p>
          <Link href="/coach" className="mt-2 inline-block text-primary underline">Back to roster</Link>
        </main>
      </>
    );
  }

  const trendDown = detail.weightTrend7d < 0;
  const totalLost = detail.startWeightLb - (detail.currentWeightLb ?? detail.startWeightLb);
  const goalWeight = 200;

  return (
    <>
      <AppHeader role="coach" />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        {/* Back link */}
        <Link href="/coach" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to roster
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{detail.name}</h1>
            <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span>Day {detail.programDay}/90</span>
              <span>·</span>
              <span>{detail.phase} (Wk {detail.weekNumber}/13)</span>
              <span>·</span>
              <span>Age: {detail.ageYears ?? "—"}</span>
              {detail.physicianClearedExtendedFasts && (
                <>
                  <span>·</span>
                  <span className="text-success">Physician cleared ✓</span>
                </>
              )}
            </div>
          </div>
          <a href={`/api/coach/export?clientId=${detail.id}`}>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>

        {/* Summary cards */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Start</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{detail.startWeightLb} lb</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Current</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{detail.currentWeightLb ?? "—"} lb</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Lost</p>
            <p className="mt-1 font-mono text-lg font-semibold text-success tabular-nums">{totalLost > 0 ? `-${totalLost.toFixed(1)}` : "0"} lb</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Goal</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{goalWeight} lb</p>
          </div>
        </section>

        {/* 7-day stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7-Day Compliance</CardTitle>
            <CardDescription>Rolling 7-day window · Last check-in: {getDaysAgoLabel(detail.lastCheckIn)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Workouts</p>
                <p className="font-mono text-lg font-semibold tabular-nums">{detail.workoutCompletion}%</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Walks</p>
                <p className="font-mono text-lg font-semibold tabular-nums">{detail.walkCompletion}%</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Protein</p>
                <p className="font-mono text-lg font-semibold tabular-nums">{detail.proteinHitRate}%</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Weight Trend</p>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {trendDown ? "" : "+"}{detail.weightTrend7d.toFixed(1)}
                  </span>
                  {trendDown ? <TrendingDown className="h-4 w-4 text-success" /> : <TrendingUp className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight chart */}
        {detail.weightHistory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <CardDescription>{detail.weightHistory.length} weigh-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <WeightChart data={detail.weightHistory} goalWeight={goalWeight} />
            </CardContent>
          </Card>
        )}

        {/* Messages — same 1:1 as the client Coach tab */}
        {thread && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>1:1 with {detail.name}. Staff is not in this thread.</CardDescription>
            </CardHeader>
            <CardContent>
              <MessageThread
                clientId={thread.clientId}
                selfRole="coach"
                coachName={thread.coachName}
                clientName={thread.clientName}
                initialMessages={thread.messages}
                canSend={thread.canSend}
              />
            </CardContent>
          </Card>
        )}

        {/* Coach notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Coach Notes</CardTitle>
            <CardDescription>Private notes about this client</CardDescription>
          </CardHeader>
          <CardContent>
            <NotesPanel clientId={detail.id} notes={detail.coachNotes} />
          </CardContent>
        </Card>

        {/* Band calibration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Band Calibration</CardTitle>
            <CardDescription>Day 1 resistance band baseline — re-calibrate at Day 31, 61</CardDescription>
          </CardHeader>
          <CardContent>
            <BandCalibrationPanel clientId={detail.id} calibration={detail.bandCalibration} />
          </CardContent>
        </Card>

        {/* Recent check-ins */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Check-Ins</CardTitle>
            <CardDescription>Last {Math.min(detail.checkIns.length, 30)} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Workout</th>
                    <th className="py-2 pr-4">Steps</th>
                    <th className="py-2 pr-4">Protein</th>
                    <th className="py-2 pr-4">Mood</th>
                    <th className="py-2 pr-4">Energy</th>
                    <th className="py-2 pr-4">Sleep</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.checkIns.slice(0, 30).map((c) => (
                    <tr key={c.date} className="border-b border-border/50 font-mono text-xs tabular-nums">
                      <td className="py-2 pr-4">{c.date}</td>
                      <td className="py-2 pr-4">{c.workoutDone === true ? "✓" : c.workoutDone === false ? "✗" : "—"}</td>
                      <td className="py-2 pr-4">{c.steps?.toLocaleString() ?? "—"}</td>
                      <td className="py-2 pr-4">{c.proteinG ?? "—"}g</td>
                      <td className="py-2 pr-4">{c.mood ?? "—"}/5</td>
                      <td className="py-2 pr-4">{c.energy ?? "—"}/5</td>
                      <td className="py-2 pr-4">{c.sleepHours ?? "—"}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
