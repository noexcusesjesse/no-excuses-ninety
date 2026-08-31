import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientDetail, getDaysAgoLabel } from "@/db/queries";
import { formatDateShort, formatDayInBlock } from "@/lib/program-position";
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

  const snap = detail.snapshot;
  const pos = snap.position;
  const trendDown = detail.weightTrend7d < 0;
  const totalLost = detail.startWeightLb - (detail.currentWeightLb ?? detail.startWeightLb);
  const goalWeight = 200;

  return (
    <>
      <AppHeader role="coach" />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        <Link href="/coach" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to roster
        </Link>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Coach · LoadLine
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{detail.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
              <span>{snap.whereLine}</span>
              <span>·</span>
              <span>Age: {detail.ageYears ?? "—"}</span>
            </div>
            {snap.secondary && (
              <p className="mt-1 text-sm text-muted-foreground">{snap.secondary}</p>
            )}
          </div>
          <a href={`/api/coach/export?clientId=${detail.id}`}>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Block</p>
            <p className="mt-1 text-lg font-semibold leading-tight">{snap.blockLabel}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{formatDayInBlock(pos)}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Month</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{snap.monthLabel}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {formatDayInBlock(pos)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Last log</p>
            <p className={`mt-1 text-lg font-semibold ${snap.missingLog ? "text-destructive" : ""}`}>
              {getDaysAgoLabel(detail.lastCheckIn)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {snap.missingLog ? "Missing — outreach" : "Logged recently"}
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Extended fasts</p>
            <p className="mt-1 text-sm font-semibold leading-tight">
              {snap.physicianClearedExtendedFasts ? "Physician cleared" : "Not cleared"}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {snap.overnightOnly
                ? "24h/36h not in protocol"
                : snap.extendedFast24hInProtocol
                  ? snap.extendedFast36hInProtocol
                    ? "24h in protocol · 36h month-eligible"
                    : "24h in protocol · 36h from Month 8"
                  : "24h from Month 7"}
            </p>
          </div>
        </section>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fasting protocol</CardTitle>
            <CardDescription>
              Block and month gates — not a prescription. LoadLine does not prescribe, dose, or adjust medications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{snap.fastProtocolLabel}</p>
            <p className="text-muted-foreground">
              Clearance is stored separately from protocol. 24h and 36h are not in protocol on the live LoadLine path.
              Meal window is 14:10. physicianClearedExtendedFasts is not flipped here.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              Variant on file: {detail.resetVariant === "extended_36hr" ? "extended_36hr" : "standard_24hr"}
              {" · "}LoadLine 30 Day 1: {formatDateShort(detail.startDate)}
              {" · "}LoadLine 365 window ends {formatDateShort(pos.programEndDate)}
            </p>
          </CardContent>
        </Card>

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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Band Calibration</CardTitle>
            <CardDescription>Day 1 LoadLine 30 baseline — band calibration</CardDescription>
          </CardHeader>
          <CardContent>
            <BandCalibrationPanel clientId={detail.id} calibration={detail.bandCalibration} />
          </CardContent>
        </Card>

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
