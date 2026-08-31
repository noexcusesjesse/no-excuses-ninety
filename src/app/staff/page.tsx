import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDaysAgoLabel, getStaffOps, type StaffClientRow } from "@/db/queries";
import { getStaffBroadcasts } from "@/db/messages";
import { BroadcastComposer } from "@/components/broadcast-composer";
import { openAsClientAction, openAsCoachAction } from "./actions";
import { ClipboardList, ShieldAlert, UserRound, Users } from "lucide-react";

export const dynamic = "force-dynamic";

function InterviewPill({ status }: { status: StaffClientRow["day90Interview"] }) {
  if (status === "due") {
    return (
      <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-destructive">
        Due
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-warning">
        Upcoming
      </span>
    );
  }
  return (
    <span className="font-mono text-[11px] text-muted-foreground">Not yet</span>
  );
}

function OpenAsClient({ clientId }: { clientId: string }) {
  return (
    <form action={openAsClientAction}>
      <input type="hidden" name="clientId" value={clientId} />
      <Button type="submit" variant="outline" size="sm">
        Open as client
      </Button>
    </form>
  );
}

function OpenAsCoach({ coachId }: { coachId: string }) {
  return (
    <form action={openAsCoachAction}>
      <input type="hidden" name="coachId" value={coachId} />
      <Button type="submit" variant="outline" size="sm">
        Open as coach
      </Button>
    </form>
  );
}

function ClientOpsRow({ c }: { c: StaffClientRow }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{c.name}</span>
          {c.notReadyForDay1 && (
            <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-warning">
              Not Day 1
            </span>
          )}
          {c.missingLogs && (
            <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-destructive">
              Missing log
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
          <span>{c.blockLabel}</span>
          <span>·</span>
          <span>{c.monthLabel}</span>
          <span>·</span>
          <span>Coach: {c.coachName}</span>
          <span>·</span>
          <span>Last log: {getDaysAgoLabel(c.lastCheckIn)}</span>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Clearance</p>
        <p className={`font-mono text-xs ${c.physicianClearedExtendedFasts ? "text-success" : "text-warning"}`}>
          {c.physicianClearedExtendedFasts
            ? "Extended-fast ✓"
            : c.extendedFast24hEligibleByMonth
              ? "Not cleared · month 7+"
              : "Not cleared"}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="font-mono text-[10px] uppercase text-muted-foreground">Day 90</p>
        <InterviewPill status={c.day90Interview} />
      </div>
      <div className="flex flex-wrap gap-2">
        <OpenAsClient clientId={c.id} />
        <OpenAsCoach coachId={c.coachId} />
      </div>
    </div>
  );
}

export default async function StaffHousePage() {
  const ops = await getStaffOps();
  const broadcasts = await getStaffBroadcasts();
  if (!ops) {
    return <p className="py-12 text-center text-muted-foreground">Staff session required.</p>;
  }

  const notReady = ops.clients.filter((c) => c.notReadyForDay1);
  const missingLogs = ops.clients.filter((c) => c.missingLogs);
  const missingClearance = ops.clients.filter((c) => !c.physicianClearedExtendedFasts);
  const day90 = ops.clients.filter((c) => c.day90Interview !== "not_yet");

  return (
    <>
      <section className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Staff · LoadLine
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Program ops
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          All clients and coaches · phase · Day 1 readiness · missing logs. This is not a daily log.
        </p>
      </section>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Program broadcast</CardTitle>
          <CardDescription>
            All users, clients only, or coaches only. Recipients see LoadLine, not Staff. Staff is not in 1:1 coach–client threads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BroadcastComposer initial={broadcasts} />
        </CardContent>
      </Card>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-md border border-border bg-card p-3">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{ops.counts.clients}</p>
          <p className="text-xs text-muted-foreground">Clients</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{ops.counts.coaches}</p>
          <p className="text-xs text-muted-foreground">Coaches</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <ClipboardList className="h-3.5 w-3.5 text-warning" />
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{ops.counts.notReadyForDay1}</p>
          <p className="text-xs text-muted-foreground">Not ready for Day 1</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <ClipboardList className="h-3.5 w-3.5 text-destructive" />
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{ops.counts.missingLogs}</p>
          <p className="text-xs text-muted-foreground">Missing logs</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <ShieldAlert className="h-3.5 w-3.5 text-warning" />
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{ops.counts.missingClearance}</p>
          <p className="text-xs text-muted-foreground">No extended-fast clearance</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <ClipboardList className="h-3.5 w-3.5 text-destructive" />
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums">{ops.counts.day90Due}</p>
          <p className="text-xs text-muted-foreground">
            Day 90 due{ops.counts.day90Upcoming ? ` · ${ops.counts.day90Upcoming} upcoming` : ""}
          </p>
        </div>
      </section>

      {notReady.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Not ready for Day 1</CardTitle>
            <CardDescription>Still in Boot Camp analog or not yet started. LoadLine 30 Day 1 has not begun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {notReady.map((c) => (
              <ClientOpsRow key={c.id} c={c} />
            ))}
          </CardContent>
        </Card>
      )}

      {missingLogs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Missing logs</CardTitle>
            <CardDescription>No check-in yesterday or earlier after the program started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingLogs.map((c) => (
              <ClientOpsRow key={c.id} c={c} />
            ))}
          </CardContent>
        </Card>
      )}

      {missingClearance.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Missing extended-fast clearance</CardTitle>
            <CardDescription>
              24h starts Month 7+, 36h Month 8+ only if physician-cleared and extended_36hr. Not required for Day 1.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingClearance.map((c) => (
              <ClientOpsRow key={c.id} c={c} />
            ))}
          </CardContent>
        </Card>
      )}

      {day90.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Day 90 exit interviews</CardTitle>
            <CardDescription>
              The Ninety ends on each client&apos;s Day 90 (first cohort: Nov 29, 2026). Due on that date and after.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {day90.map((c) => (
              <ClientOpsRow key={c.id} c={c} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Coaches</CardTitle>
          <CardDescription>Open as coach to use the existing roster — Staff does not replace it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ops.coaches.map((coach) => (
            <div
              key={coach.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{coach.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {coach.email} · {coach.clientCount} client{coach.clientCount === 1 ? "" : "s"}
                </p>
              </div>
              <OpenAsCoach coachId={coach.id} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All clients</CardTitle>
          <CardDescription>LoadLine phase from startDate (Day 1 of LoadLine 30). Open as client to see their house.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ops.clients.map((c) => (
            <ClientOpsRow key={c.id} c={c} />
          ))}
        </CardContent>
      </Card>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        LoadLine does not prescribe, dose, or adjust medications.
      </p>
    </>
  );
}
