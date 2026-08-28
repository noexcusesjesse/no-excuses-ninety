import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCoachClients, getDaysAgoLabel, type CoachClientRow } from "@/db/queries";
import { getProgramNotices } from "@/db/messages";
import { ProgramNotices } from "@/components/program-notices";
import {
  Bell,
  ChevronRight,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

// DB-backed — must be evaluated per request, not prerendered.
export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: CoachClientRow["status"] }) {
  const map = {
    "on-track": { label: "On track", classes: "bg-success/15 text-success border-success/30" },
    slipping: { label: "Slipping", classes: "bg-warning/15 text-warning border-warning/30" },
    off: { label: "Off", classes: "bg-destructive/15 text-destructive border-destructive/30" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${s.classes}`}>
      {s.label}
    </span>
  );
}

function BlockPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-secondary-foreground">
      {label}
    </span>
  );
}

function FastPill({ c }: { c: CoachClientRow }) {
  const overnight = c.snapshot.overnightOnly;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        overnight
          ? "border-border bg-muted text-muted-foreground"
          : c.snapshot.extendedFast24hInProtocol
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {c.snapshot.fastProtocolShort}
    </span>
  );
}

function ClientRow({ c }: { c: CoachClientRow }) {
  const trendDown = c.weightTrend7d < 0;
  const snap = c.snapshot;
  return (
    <Link
      href={`/coach/${c.id}`}
      className="grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-mono text-xs text-secondary-foreground">
        {c.initials}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{c.name}</span>
          <StatusPill status={c.status} />
          <BlockPill label={snap.blockLabel} />
          <FastPill c={c} />
          {snap.missingLog && (
            <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-destructive">
              Missing log
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
          <span>{snap.whereLine}</span>
          <span>·</span>
          <span>Last: {getDaysAgoLabel(c.lastCheckIn)}</span>
          <span>·</span>
          <span>
            {snap.physicianClearedExtendedFasts ? "Physician cleared" : "Not cleared"}
            {snap.overnightOnly ? " · 24h/36h not in protocol" : snap.extendedFast24hInProtocol ? "" : " · 24h from Month 7"}
          </span>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Workouts</p>
        <p className="font-mono text-sm tabular-nums">{c.workoutCompletion}%</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Protein</p>
        <p className="font-mono text-sm tabular-nums">{c.proteinHitRate}%</p>
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${trendDown ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
          {trendDown ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
        </div>
        <span className="font-mono text-sm tabular-nums">
          {trendDown ? "" : "+"}{c.weightTrend7d.toFixed(1)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

export default async function CoachDashboardPage() {
  const clients = await getCoachClients();
  const notices = await getProgramNotices();
  const onTrack = clients.filter((c) => c.status === "on-track").length;
  const slipping = clients.filter((c) => c.status === "slipping").length;
  const off = clients.filter((c) => c.status === "off").length;
  const missingLogs = clients.filter((c) => c.snapshot.missingLog);

  return (
    <>
      <AppHeader role="coach" />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Coach · No Excuses Reset Program
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your roster
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {clients.length} active clients · {onTrack} on track, {slipping} slipping, {off} need outreach
              {missingLogs.length > 0 ? ` · ${missingLogs.length} missing logs` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Link href="/coach/new">
              <Button>
                <Users className="h-4 w-4" />
                Add client
              </Button>
            </Link>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-border bg-card p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{clients.length}</p>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <div className="flex items-center justify-between text-success">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{onTrack}</p>
            <p className="text-xs text-muted-foreground">On track</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <div className="flex items-center justify-between text-warning">
              <div className="h-1.5 w-1.5 rounded-full bg-warning" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{slipping}</p>
            <p className="text-xs text-muted-foreground">Slipping</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <div className="flex items-center justify-between text-destructive">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{missingLogs.length}</p>
            <p className="text-xs text-muted-foreground">Missing logs</p>
          </div>
        </section>

        {missingLogs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Missing logs</CardTitle>
                  <CardDescription>No check-in today or yesterday</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {missingLogs.map((c) => (
                <ClientRow key={c.id} c={c} />
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Program</CardTitle>
            <CardDescription>From LoadLine. Open a client file to use the 1:1 thread — Staff is not in those threads.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgramNotices notices={notices} />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Needs attention</CardTitle>
                <CardDescription>Check-ins missed or trending wrong</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                Set alerts
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {clients.filter((c) => c.status !== "on-track").length === 0 ? (
              <p className="text-sm text-muted-foreground">Everyone is on track.</p>
            ) : (
              clients.filter((c) => c.status !== "on-track").map((c) => (
                <ClientRow key={c.id} c={c} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All clients</CardTitle>
            <CardDescription>15-month Reset · click any client for their file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {clients.map((c) => (
              <ClientRow key={c.id} c={c} />
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
