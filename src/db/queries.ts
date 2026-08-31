/**
 * Data access layer — replaces src/lib/mock-data.ts.
 *
 * Each function takes a clientId (or coachId) and returns shaped data
 * ready for the dashboard components. No DB types leak past this boundary.
 *
 * Auth: functions that require a clientId/coachId get it from the session
 * via getSession() + requireClient()/requireCoach() from @/lib/auth.
 */
import "server-only";
import { db, schema, first } from "./client";
import { and, eq, desc, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import {
  formValuesFromRows,
  mapFormToPatches,
  planCheckinUpsert,
  planWeightUpsert,
  type DailyLogFormInput,
  type ExistingCheckin,
  type ExistingWeight,
  type TodayLogFormValues,
} from "@/lib/daily-log";
import {
  addDays,
  blockLabel,
  coachProgramSnapshot,
  currentMonthWindow,
  day90InterviewStatus,
  diffDays,
  formatMonthLabel,
  getDayPlan,
  getProgramPosition,
  isBeforeDay1,
  todayISODate,
  type CoachProgramSnapshot,
  type Day90InterviewStatus,
  type ProgramPosition,
} from "@/lib/program-position";

export type WorkoutLetter = "A" | "B" | "REST";

export interface ClientToday {
  id: string;
  name: string;
  programDay: number;
  weekNumber: number;
  phase: string;
  startDate: string;
  position: ProgramPosition;
  plan: {
    date: string;
    dayLabel: string;
    workout: WorkoutLetter;
    walkMinutes: number;
    isFastedWalk: boolean;
    isDeload: boolean;
  };
  workoutStreak: number;
  walkStreak: number;
  proteinToday: number;
  proteinTarget: number;
  hydrationOz: number;
  hydrationTarget: number;
  stepsToday: number;
  stepsTarget: number;
  sleepHours: number;
  cpapHours: number;
  mood: number | null;
  energy: number | null;
  physicianClearedExtendedFasts: boolean;
}

/**
 * Get the current client's dashboard data.
 * Reads clientId from the session — no more hardcoded demo client.
 */
export async function getClientToday(): Promise<ClientToday | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "client") return null;
  const clientId = session.userId;

  const today = todayISODate();
  const client = first(
    await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1),
  );
  if (!client) return null;

  const position = getProgramPosition(client.startDate, today);
  const plan = getDayPlan(position);

  // Today's check-in (may be null if not yet logged)
  const todayCheckin = first(
    await db.select().from(schema.dailyCheckins)
      .where(and(eq(schema.dailyCheckins.clientId, client.id), eq(schema.dailyCheckins.date, today)))
      .limit(1),
  );

  // Walk streak: count consecutive days back from today with walkMinutes > 0
  const recentCheckins = await db.select().from(schema.dailyCheckins)
    .where(eq(schema.dailyCheckins.clientId, client.id))
    .orderBy(desc(schema.dailyCheckins.date))
    .limit(90);

  let walkStreak = 0;
  for (const ci of recentCheckins) {
    if ((ci.walkMinutes ?? 0) > 0) walkStreak++;
    else break;
  }

  let workoutStreak = 0;
  for (let i = 0; i < recentCheckins.length; i++) {
    const date = recentCheckins[i]?.date;
    if (!date) break;
    const dayPos = getProgramPosition(client.startDate, date);
    const dayPlan = getDayPlan(dayPos);
    if (dayPlan.workout === "REST") { workoutStreak++; continue; }
    if (recentCheckins[i]?.workoutDone === true) workoutStreak++;
    else break;
  }

  return {
    id: client.id,
    name: client.name.split(" ")[0],
    programDay: position.programDay,
    weekNumber: position.ninetyWeek ?? position.programMonth ?? 0,
    phase: position.ninetyPhase ?? blockLabel(position.block),
    startDate: client.startDate,
    position,
    plan: {
      date: today,
      dayLabel: plan.dayLabel,
      workout: plan.workout,
      walkMinutes: plan.walkMinutes,
      isFastedWalk: plan.isFastedWalk,
      isDeload: plan.isDeload,
    },
    workoutStreak,
    walkStreak,
    proteinToday: todayCheckin?.proteinG ?? 0,
    proteinTarget: 170,
    hydrationOz: todayCheckin?.hydrationOz ?? 0,
    hydrationTarget: 100,
    stepsToday: todayCheckin?.steps ?? 0,
    stepsTarget: 7000,
    sleepHours: todayCheckin?.sleepHours ?? 0,
    cpapHours: todayCheckin?.cpapHours ?? 0,
    mood: todayCheckin?.mood ?? null,
    energy: todayCheckin?.energy ?? null,
    physicianClearedExtendedFasts: client.physicianClearedExtendedFasts ?? false,
  };
}

export interface CoachClientRow {
  id: string;
  name: string;
  initials: string;
  startDate: string;
  snapshot: CoachProgramSnapshot;
  lastCheckIn: string | null;
  workoutCompletion: number;
  walkCompletion: number;
  proteinHitRate: number;
  weightTrend7d: number;
  status: "on-track" | "slipping" | "off";
  currentWeight: number | null;
  moodAvg: number;
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function daysAgoLabel(iso: string | null): string {
  if (!iso) return "Never";
  const days = diffDays(iso, todayISODate());
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

async function lastCheckinDate(clientId: string): Promise<string | null> {
  const row = first(
    await db.select({ date: schema.dailyCheckins.date })
      .from(schema.dailyCheckins)
      .where(eq(schema.dailyCheckins.clientId, clientId))
      .orderBy(desc(schema.dailyCheckins.date))
      .limit(1),
  );
  return row?.date ?? null;
}

async function rolling7DayStats(clientId: string, asOf: string) {
  const sevenDaysAgo = addDays(asOf, -6);
  const recent = await db.select().from(schema.dailyCheckins)
    .where(and(eq(schema.dailyCheckins.clientId, clientId), gte(schema.dailyCheckins.date, sevenDaysAgo)));

  const aBDaysInWindow = recent.filter((ci) => {
    const d = new Date(ci.date + "T00:00:00Z");
    const dow = d.getUTCDay();
    return dow === 1 || dow === 3 || dow === 5;
  });
  const workoutsCompleted = aBDaysInWindow.filter((ci) => ci.workoutDone === true).length;
  const workoutCompletion = aBDaysInWindow.length ? Math.round((workoutsCompleted / aBDaysInWindow.length) * 100) : 0;
  const walksCompleted = recent.filter((ci) => (ci.walkMinutes ?? 0) > 0).length;
  const walkCompletion = recent.length ? Math.round((walksCompleted / recent.length) * 100) : 0;
  const proteinHits = recent.filter((ci) => (ci.proteinG ?? 0) >= 140).length;
  const proteinHitRate = recent.length ? Math.round((proteinHits / recent.length) * 100) : 0;
  const moods = recent.map((ci) => ci.mood).filter((m): m is number => m != null);
  const moodAvg = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0;

  return { workoutCompletion, walkCompletion, proteinHitRate, moodAvg };
}

function complianceStatus(
  daysSince: number,
  workoutCompletion: number,
  proteinHitRate: number,
): "on-track" | "slipping" | "off" {
  if (daysSince > 5 || workoutCompletion < 30) return "off";
  if (workoutCompletion < 70 || proteinHitRate < 60) return "slipping";
  return "on-track";
}

export async function getCoachClients(): Promise<CoachClientRow[]> {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") return [];
  const coachId = session.userId;

  const coach = first(
    await db.select().from(schema.coaches).where(eq(schema.coaches.id, coachId)).limit(1),
  );
  if (!coach) return [];

  const clients = await db.select().from(schema.clients)
    .where(eq(schema.clients.coachId, coach.id));

  const asOf = todayISODate();
  const sevenDaysAgo = addDays(asOf, -6);

  const rows = await Promise.all(clients.map(async (c) => {
    const lastCheckIn = await lastCheckinDate(c.id);
    const snapshot = coachProgramSnapshot(
      c.startDate,
      asOf,
      lastCheckIn,
      c.physicianClearedExtendedFasts ?? false,
    );
    const { workoutCompletion, walkCompletion, proteinHitRate, moodAvg } =
      await rolling7DayStats(c.id, asOf);

    const w7dAgo = first(
      await db.select().from(schema.weights)
        .where(and(eq(schema.weights.clientId, c.id), eq(schema.weights.date, sevenDaysAgo)))
        .limit(1),
    );
    const wNow = first(
      await db.select().from(schema.weights)
        .where(eq(schema.weights.clientId, c.id))
        .orderBy(desc(schema.weights.date)).limit(1),
    );
    const weightTrend7d = w7dAgo && wNow ? Math.round((wNow.weightLb - w7dAgo.weightLb) * 10) / 10 : 0;

    const daysSince = snapshot.daysSinceCheckIn ?? 999;
    const status = complianceStatus(daysSince, workoutCompletion, proteinHitRate);

    return {
      id: c.id,
      name: c.name,
      initials: initials(c.name),
      startDate: c.startDate,
      snapshot,
      lastCheckIn,
      workoutCompletion,
      walkCompletion,
      proteinHitRate,
      weightTrend7d,
      status,
      currentWeight: wNow?.weightLb ?? null,
      moodAvg,
    };
  }));
  return rows.sort((a, b) => {
    const order = { "off": 0, "slipping": 1, "on-track": 2 } as const;
    const byStatus = order[a.status] - order[b.status];
    if (byStatus !== 0) return byStatus;
    if (a.snapshot.missingLog !== b.snapshot.missingLog) {
      return a.snapshot.missingLog ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

// ============================================================================
// COACH — SINGLE CLIENT DETAIL (for /coach/[clientId])
// ============================================================================

export interface ClientDetail {
  id: string;
  name: string;
  email: string;
  startDate: string;
  startWeightLb: number;
  currentWeightLb: number | null;
  heightIn: number | null;
  dateOfBirth: string | null;
  ageYears: number | null;
  snapshot: CoachProgramSnapshot;
  resetVariant: "standard_24hr" | "extended_36hr";
  workoutCompletion: number;
  walkCompletion: number;
  proteinHitRate: number;
  weightTrend7d: number;
  status: "on-track" | "slipping" | "off";
  moodAvg: number;
  lastCheckIn: string | null;
  checkIns: Array<{
    date: string;
    workoutDone: boolean | null;
    walkMinutes: number | null;
    steps: number | null;
    proteinG: number | null;
    hydrationOz: number | null;
    mood: number | null;
    energy: number | null;
    sleepHours: number | null;
    cpapHours: number | null;
    fastType: string | null;
    notes: string | null;
  }>;
  weightHistory: Array<{
    date: string;
    weightLb: number;
    waistIn: number | null;
  }>;
  coachNotes: Array<{
    id: string;
    note: string;
    createdAt: number;
  }>;
  bandCalibration: Array<{
    id: string;
    tubeColor: string;
    length: string;
    cleanReps: number | null;
    perceivedResistance: number | null;
    startingLevel: string;
    createdAt: number;
  }>;
}

export async function getClientDetail(
  clientId: string,
): Promise<ClientDetail | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") return null;

  const client = first(
    await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1),
  );
  if (!client) return null;

  // Verify this client belongs to the coach
  if (client.coachId !== session.userId) return null;

  const asOf = todayISODate();
  const sevenDaysAgo = addDays(asOf, -6);
  const lastCheckIn = await lastCheckinDate(clientId);
  const snapshot = coachProgramSnapshot(
    client.startDate,
    asOf,
    lastCheckIn,
    client.physicianClearedExtendedFasts ?? false,
  );
  const { workoutCompletion, walkCompletion, proteinHitRate, moodAvg } =
    await rolling7DayStats(clientId, asOf);

  const w7dAgo = first(
    await db.select().from(schema.weights)
      .where(and(eq(schema.weights.clientId, clientId), eq(schema.weights.date, sevenDaysAgo)))
      .limit(1),
  );
  const wNow = first(
    await db.select().from(schema.weights)
      .where(eq(schema.weights.clientId, clientId)).orderBy(desc(schema.weights.date)).limit(1),
  );
  const weightTrend7d = w7dAgo && wNow ? Math.round((wNow.weightLb - w7dAgo.weightLb) * 10) / 10 : 0;

  const daysSince = snapshot.daysSinceCheckIn ?? 999;
  const status = complianceStatus(daysSince, workoutCompletion, proteinHitRate);

  const allCheckins = await db.select().from(schema.dailyCheckins)
    .where(eq(schema.dailyCheckins.clientId, clientId))
    .orderBy(desc(schema.dailyCheckins.date)).limit(90);

  const allWeights = await db.select().from(schema.weights)
    .where(eq(schema.weights.clientId, clientId))
    .orderBy(schema.weights.date);

  const notes = await db.select().from(schema.auditLog)
    .where(and(eq(schema.auditLog.clientId, clientId), eq(schema.auditLog.action, "note_added")))
    .orderBy(desc(schema.auditLog.createdAt));

  const calibration = await db.select().from(schema.auditLog)
    .where(and(eq(schema.auditLog.clientId, clientId), eq(schema.auditLog.action, "band_calibration")))
    .orderBy(desc(schema.auditLog.createdAt));

  let ageYears: number | null = null;
  if (client.dateOfBirth) {
    const dob = new Date(client.dateOfBirth);
    ageYears = Math.floor((Date.now() - dob.getTime()) / (365.25 * 86400000));
  }

  const resetVariant = client.resetVariant === "extended_36hr" ? "extended_36hr" : "standard_24hr";

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    startDate: client.startDate,
    startWeightLb: client.startWeightLb,
    currentWeightLb: wNow?.weightLb ?? null,
    heightIn: client.heightIn ?? null,
    dateOfBirth: client.dateOfBirth ?? null,
    ageYears,
    snapshot,
    resetVariant,
    workoutCompletion, walkCompletion, proteinHitRate,
    weightTrend7d, status, moodAvg,
    lastCheckIn,
    checkIns: allCheckins.map((c) => ({
      date: c.date,
      workoutDone: c.workoutDone,
      walkMinutes: c.walkMinutes,
      steps: c.steps,
      proteinG: c.proteinG,
      hydrationOz: c.hydrationOz,
      mood: c.mood,
      energy: c.energy,
      sleepHours: c.sleepHours,
      cpapHours: c.cpapHours,
      fastType: c.fastType,
      notes: c.notes,
    })),
    weightHistory: allWeights.map((w) => ({
      date: w.date,
      weightLb: w.weightLb,
      waistIn: w.waistIn ?? null,
    })),
    coachNotes: notes.map((n) => ({
      id: n.id,
      note: n.details ?? "",
      createdAt: n.createdAt ? new Date(n.createdAt).getTime() : 0,
    })),
    bandCalibration: calibration.map((c) => {
      const parsed = c.details ? JSON.parse(c.details) : {};
      return {
        id: c.id,
        tubeColor: parsed.tubeColor ?? "",
        length: parsed.length ?? "",
        cleanReps: parsed.cleanReps ?? null,
        perceivedResistance: parsed.perceivedResistance ?? null,
        startingLevel: parsed.startingLevel ?? "",
        createdAt: c.createdAt ? new Date(c.createdAt).getTime() : 0,
      };
    }),
  };
}

// ============================================================================
// COACH — ADD CLIENT
// ============================================================================

export interface NewClientInput {
  name: string;
  email: string;
  startDate: string;
  startWeightLb: number;
  heightIn?: number;
  dateOfBirth?: string;
  physicianClearedExtendedFasts?: boolean;
}

export async function createClient(input: NewClientInput): Promise<string | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") return null;
  const coachId = session.userId;

  const { hashSync } = await import("bcryptjs");
  const { randomUUID } = await import("node:crypto");
  const clientId = randomUUID();
  const passwordHash = hashSync("client-demo", 10); // default password

  await db.insert(schema.clients).values({
    id: clientId,
    coachId,
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name,
    startDate: input.startDate,
    startWeightLb: input.startWeightLb,
    heightIn: input.heightIn ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    physicianClearedExtendedFasts: input.physicianClearedExtendedFasts ?? false,
    anchorDay: 1,
    treDays: "[3,5]",
    // standard_24hr never schedules 24h during Basic Training or The Ninety —
    // getDayType gates on block + month (Month 7+). Do not default to extended_36hr.
    resetVariant: "standard_24hr",
  });

  // Log in audit
  await db.insert(schema.auditLog).values({
    id: randomUUID(),
    coachId,
    clientId,
    action: "client_created",
    details: JSON.stringify({ name: input.name, email: input.email }),
  });

  return clientId;
}

// ============================================================================
// COACH — ADD NOTE
// ============================================================================

export async function addCoachNote(clientId: string, note: string): Promise<boolean> {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") return false;

  const { randomUUID } = await import("node:crypto");
  await db.insert(schema.auditLog).values({
    id: randomUUID(),
    coachId: session.userId,
    clientId,
    action: "note_added",
    details: note,
  });

  return true;
}

// ============================================================================
// COACH — BAND CALIBRATION
// ============================================================================

export interface BandCalibrationEntry {
  tubeColor: string;
  length: string;
  cleanReps: number | null;
  perceivedResistance: number | null;
  startingLevel: string;
}

export async function addBandCalibration(
  clientId: string,
  entries: BandCalibrationEntry[],
): Promise<boolean> {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") return false;

  const { randomUUID } = await import("node:crypto");
  for (const entry of entries) {
    await db.insert(schema.auditLog).values({
      id: randomUUID(),
      coachId: session.userId,
      clientId,
      action: "band_calibration",
      details: JSON.stringify(entry),
    });
  }
  return true;
}

// ============================================================================
// COACH — CSV EXPORT
// ============================================================================

export async function exportClientCSV(clientId: string): Promise<string | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") return null;

  const detail = await getClientDetail(clientId);
  if (!detail) return null;

  const rows: string[] = [];
  // Header
  rows.push("Date,Weight (lb),Waist (in),Workout,Walk (min),Steps,Protein (g),Hydration (oz),Mood (1-5),Energy (1-5),Sleep (h),CPAP (h),Fast Type,Notes");

  // Build a map of check-ins by date
  const checkinMap = new Map(detail.checkIns.map((c) => [c.date, c]));

  // Merge weight history + check-ins
  const allDates = new Set<string>();
  detail.weightHistory.forEach((w) => allDates.add(w.date));
  detail.checkIns.forEach((c) => allDates.add(c.date));

  for (const date of Array.from(allDates).sort()) {
    const weight = detail.weightHistory.find((w) => w.date === date);
    const checkin = checkinMap.get(date);
    const row = [
      date,
      weight?.weightLb ?? "",
      weight?.waistIn ?? "",
      checkin?.workoutDone === true ? "Y" : checkin?.workoutDone === false ? "N" : "",
      checkin?.walkMinutes ?? "",
      checkin?.steps ?? "",
      checkin?.proteinG ?? "",
      checkin?.hydrationOz ?? "",
      checkin?.mood ?? "",
      checkin?.energy ?? "",
      checkin?.sleepHours ?? "",
      checkin?.cpapHours ?? "",
      checkin?.fastType ?? "",
      checkin?.notes ? `"${checkin.notes.replace(/"/g, '""')}"` : "",
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

// ============================================================================
// CYCLE DATA — for the Cycle page + Decision Engine
// ============================================================================

export function getDaysAgoLabel(iso: string | null): string { return daysAgoLabel(iso); }
export function getTodayISODate(): string { return todayISODate(); }

export interface CycleData {
  startWeight: number;
  currentWeight: number;
  weightChange: number;
  daysInCycle: number;
  loggedDays: number;
  avgCalories: number | null;
  avgProtein: number | null;
  avgSteps: number | null;
  exerciseSessions: number;
  proteinAdherencePct: number;
  stepsAdherencePct: number;
  fastingAdherencePct: number;
  monthLabel: string;
  monthOf: number;
  blockLabel: string;
}

export async function getCycleData(): Promise<CycleData | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "client") return null;
  const clientId = session.userId;

  const client = first(
    await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1),
  );
  if (!client) return null;

  const today = todayISODate();
  const position = getProgramPosition(client.startDate, today);
  const window = currentMonthWindow(position);

  const startWeight = client.startWeightLb;

  const weightRows = await db.select().from(schema.weights)
    .where(eq(schema.weights.clientId, clientId))
    .orderBy(desc(schema.weights.date));

  const currentWeight = weightRows[0]?.weightLb ?? startWeight;
  const monthStartWeight = weightRows.find((w) => w.date <= window.start)?.weightLb ?? startWeight;
  const weightChange = currentWeight - monthStartWeight;

  const checkins = (await db.select().from(schema.dailyCheckins)
    .where(eq(schema.dailyCheckins.clientId, clientId))
    .orderBy(desc(schema.dailyCheckins.date)))
    .filter((c) => c.date >= window.start && c.date <= window.end);

  const loggedDays = checkins.length;

  const calorieValues = checkins.map((c) => c.proteinG).filter((v): v is number => v != null);
  const avgProtein = calorieValues.length ? Math.round(calorieValues.reduce((a, b) => a + b, 0) / calorieValues.length) : null;
  const stepValues = checkins.map((c) => c.steps).filter((v): v is number => v != null);
  const avgSteps = stepValues.length ? Math.round(stepValues.reduce((a, b) => a + b, 0) / stepValues.length) : null;
  const avgCalories = null;

  const exerciseSessions = checkins.filter((c) => c.workoutDone === true).length;

  const proteinHits = checkins.filter((c) => (c.proteinG ?? 0) >= 140).length;
  const proteinAdherencePct = loggedDays ? Math.round((proteinHits / loggedDays) * 100) : 0;
  const stepHits = checkins.filter((c) => (c.steps ?? 0) >= 7000).length;
  const stepsAdherencePct = loggedDays ? Math.round((stepHits / loggedDays) * 100) : 0;
  const fastHits = checkins.filter((c) => c.fastType != null).length;
  const fastingAdherencePct = loggedDays ? Math.round((fastHits / loggedDays) * 100) : 0;

  return {
    startWeight: monthStartWeight,
    currentWeight,
    weightChange,
    daysInCycle: window.day,
    loggedDays,
    avgCalories, avgProtein, avgSteps,
    exerciseSessions,
    proteinAdherencePct, stepsAdherencePct, fastingAdherencePct,
    monthLabel: position.block === "basicTraining" ? "Basic Training" : `Month ${position.programMonth ?? "—"}`,
    monthOf: window.of,
    blockLabel: blockLabel(position.block),
  };
}

// ============================================================================
// WEIGHT + WAIST HISTORY — for the Progress page charts
// ============================================================================

export interface WeightEntry {
  date: string;
  weightLb: number;
  waistIn: number | null;
}

export async function getWeightHistory(): Promise<WeightEntry[]> {
  const session = await getSession();
  if (!session.userId || session.role !== "client") return [];
  const clientId = session.userId;

  const rows = await db.select().from(schema.weights)
    .where(eq(schema.weights.clientId, clientId))
    .orderBy(schema.weights.date);

  return rows.map((r) => ({
    date: r.date,
    weightLb: r.weightLb,
    waistIn: r.waistIn ?? null,
  }));
}

// ============================================================================
// CLIENT DAILY LOG — POST /api/log (do not clobber fasting timer fields)
// ============================================================================

function asExistingCheckin(row: typeof schema.dailyCheckins.$inferSelect): ExistingCheckin {
  return {
    id: row.id,
    clientId: row.clientId,
    date: row.date,
    workoutDone: row.workoutDone,
    walkMinutes: row.walkMinutes,
    steps: row.steps,
    proteinG: row.proteinG,
    hydrationOz: row.hydrationOz,
    mood: row.mood,
    energy: row.energy,
    sleepHours: row.sleepHours,
    cpapHours: row.cpapHours,
    notes: row.notes,
    fastType: row.fastType,
    fastStartMs: row.fastStartMs,
    fastEndMs: row.fastEndMs,
    fastDurationMs: row.fastDurationMs,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getTodayLogFormValues(): Promise<TodayLogFormValues | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "client") return null;
  return loadTodayLogFormValues(session.userId);
}

async function loadTodayLogFormValues(clientId: string): Promise<TodayLogFormValues> {
  const today = todayISODate();
  const checkin = first(
    await db.select().from(schema.dailyCheckins)
      .where(and(eq(schema.dailyCheckins.clientId, clientId), eq(schema.dailyCheckins.date, today)))
      .limit(1),
  );
  const weight = first(
    await db.select().from(schema.weights)
      .where(and(eq(schema.weights.clientId, clientId), eq(schema.weights.date, today)))
      .limit(1),
  );
  return formValuesFromRows(
    today,
    checkin ? asExistingCheckin(checkin) : null,
    weight ? (weight as ExistingWeight) : null,
  );
}

export async function upsertTodayLog(
  clientId: string,
  input: DailyLogFormInput,
): Promise<{ date: string; checkinId: string }> {
  const today = todayISODate();
  const now = new Date();
  const { checkin: checkinPatch, weight: weightPatch } = mapFormToPatches(input);

  return db.transaction(async (tx) => {
    const existingCheckin = first(
      await tx.select().from(schema.dailyCheckins)
        .where(and(eq(schema.dailyCheckins.clientId, clientId), eq(schema.dailyCheckins.date, today)))
        .limit(1),
    );
    const plan = planCheckinUpsert(
      existingCheckin ? asExistingCheckin(existingCheckin) : null,
      checkinPatch,
      { id: crypto.randomUUID(), clientId, date: today, now },
    );

    let checkinId: string;
    if (plan.kind === "insert") {
      const row = plan.row;
      await tx.insert(schema.dailyCheckins).values({
        id: row.id,
        clientId: row.clientId,
        date: row.date,
        workoutDone: row.workoutDone,
        walkMinutes: row.walkMinutes,
        steps: row.steps,
        proteinG: row.proteinG,
        hydrationOz: row.hydrationOz,
        mood: row.mood,
        energy: row.energy,
        sleepHours: row.sleepHours,
        cpapHours: row.cpapHours,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      checkinId = row.id;
    } else {
      await tx.update(schema.dailyCheckins)
        .set(plan.set)
        .where(eq(schema.dailyCheckins.id, plan.id));
      checkinId = plan.id;
    }

    const existingWeight = first(
      await tx.select().from(schema.weights)
        .where(and(eq(schema.weights.clientId, clientId), eq(schema.weights.date, today)))
        .limit(1),
    );
    const weightPlan = planWeightUpsert(
      existingWeight ? (existingWeight as ExistingWeight) : null,
      weightPatch,
      { id: crypto.randomUUID(), clientId, date: today },
    );
    if (weightPlan.kind === "insert") {
      await tx.insert(schema.weights).values({
        id: weightPlan.row.id,
        clientId: weightPlan.row.clientId,
        date: weightPlan.row.date,
        weightLb: weightPlan.row.weightLb,
        waistIn: weightPlan.row.waistIn,
      });
    } else if (weightPlan.kind === "update") {
      await tx.update(schema.weights)
        .set(weightPlan.set)
        .where(eq(schema.weights.id, weightPlan.id));
    }

    return { date: today, checkinId };
  });
}

// ============================================================================
// CLIENT PROFILE — for BMR/TDEE calculations
// ============================================================================

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  startWeightLb: number;
  currentWeightLb: number;
  heightIn: number | null;
  dateOfBirth: string | null;
  startDate: string;
  physicianClearedExtendedFasts: boolean;
  ageYears: number | null;
}

export async function getClientProfile(): Promise<ClientProfile | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "client") return null;
  const clientId = session.userId;

  const client = first(
    await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1),
  );
  if (!client) return null;

  const weightRows = await db.select().from(schema.weights)
    .where(eq(schema.weights.clientId, clientId))
    .orderBy(desc(schema.weights.date)).limit(1);

  let ageYears: number | null = null;
  if (client.dateOfBirth) {
    const dob = new Date(client.dateOfBirth);
    const now = new Date();
    ageYears = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 86400000));
  }

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    startWeightLb: client.startWeightLb,
    currentWeightLb: weightRows[0]?.weightLb ?? client.startWeightLb,
    heightIn: client.heightIn ?? null,
    dateOfBirth: client.dateOfBirth ?? null,
    startDate: client.startDate,
    physicianClearedExtendedFasts: client.physicianClearedExtendedFasts ?? false,
    ageYears,
  };
}

// ============================================================================
// STAFF — PROGRAM OPS (not a daily log)
// ============================================================================

export interface StaffClientRow {
  id: string;
  name: string;
  email: string;
  coachId: string;
  coachName: string;
  startDate: string;
  blockLabel: string;
  monthLabel: string;
  programDay: number;
  lastCheckIn: string | null;
  missingLogs: boolean;
  physicianClearedExtendedFasts: boolean;
  notReadyForDay1: boolean;
  day90Interview: Day90InterviewStatus;
  extendedFast24hEligibleByMonth: boolean;
}

export interface StaffCoachRow {
  id: string;
  name: string;
  email: string;
  clientCount: number;
}

export interface StaffOpsData {
  coaches: StaffCoachRow[];
  clients: StaffClientRow[];
  counts: {
    clients: number;
    coaches: number;
    notReadyForDay1: number;
    missingLogs: number;
    missingClearance: number;
    day90Due: number;
    day90Upcoming: number;
  };
}

export async function getStaffOps(): Promise<StaffOpsData | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "staff") return null;

  const today = todayISODate();
  const yesterday = addDays(today, -1);

  const coaches = await db.select().from(schema.coaches);
  const clients = await db.select().from(schema.clients);
  const coachName = new Map(coaches.map((c) => [c.id, c.name]));

  const rows: StaffClientRow[] = await Promise.all(clients.map(async (c) => {
    const position = getProgramPosition(c.startDate, today);
    const lastCheckin = first(
      await db.select().from(schema.dailyCheckins)
        .where(eq(schema.dailyCheckins.clientId, c.id))
        .orderBy(desc(schema.dailyCheckins.date))
        .limit(1),
    );

    const started = position.block !== "before";
    const lastDate = lastCheckin?.date ?? null;
    const missingLogs = started && (!lastDate || lastDate < yesterday);

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      coachId: c.coachId,
      coachName: coachName.get(c.coachId) ?? "—",
      startDate: c.startDate,
      blockLabel: blockLabel(position.block),
      monthLabel: formatMonthLabel(position),
      programDay: position.programDay,
      lastCheckIn: lastDate,
      missingLogs,
      physicianClearedExtendedFasts: c.physicianClearedExtendedFasts ?? false,
      notReadyForDay1: isBeforeDay1(position.block),
      day90Interview: day90InterviewStatus(position),
      extendedFast24hEligibleByMonth: position.extendedFast24hEligibleByMonth,
    };
  }));

  rows.sort((a, b) => {
    const rank = (r: StaffClientRow) => {
      if (r.notReadyForDay1) return 0;
      if (r.missingLogs) return 1;
      if (r.day90Interview === "due") return 2;
      if (!r.physicianClearedExtendedFasts) return 3;
      return 4;
    };
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name);
  });

  const coachRows: StaffCoachRow[] = coaches.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    clientCount: clients.filter((cl) => cl.coachId === c.id).length,
  })).sort((a, b) => a.name.localeCompare(b.name));

  return {
    coaches: coachRows,
    clients: rows,
    counts: {
      clients: rows.length,
      coaches: coachRows.length,
      notReadyForDay1: rows.filter((r) => r.notReadyForDay1).length,
      missingLogs: rows.filter((r) => r.missingLogs).length,
      missingClearance: rows.filter((r) => !r.physicianClearedExtendedFasts).length,
      day90Due: rows.filter((r) => r.day90Interview === "due").length,
      day90Upcoming: rows.filter((r) => r.day90Interview === "upcoming").length,
    },
  };
}
