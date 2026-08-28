/**
 * Seed the DB with: 1 staff (Jesse, ops), 1 coach, 6 clients, The Ninety 1–90
 * template, and daily check-ins per client.
 *
 * First-cohort default: Marcus startDate = 2026-09-01 (Day 1 of The Ninety).
 * Basic Training is Aug 18–31. He is physician-cleared; 24h/36h still must not
 * appear until Month 7 / Month 8.
 *
 * Run: npm run db:seed (after npm run db:migrate)
 * Idempotent: staff is seeded independently; existing coach email skips clients.
 */
import "dotenv/config";
import { db, schema, first, sql as pg } from "./client";
import { eq } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  FIRST_COHORT_DAY_ONE,
  addDays,
  diffDays,
  getDayPlan,
  getProgramPosition,
  todayISODate,
} from "../lib/program-position";

const COACH_EMAIL = "coach@loadlinefitness.com";
const COACH_PASSWORD = "loadline-demo";
const STAFF_EMAIL = "staff@loadlinefitness.com";
const STAFF_PASSWORD = "staff-demo";

const CLIENT_SEED: Array<{
  email: string;
  name: string;
  startWeight: number;
  moodAvg: number;
  sw: number;
  sk: number;
  startDate?: string;
  startDaysAgo?: number;
}> = [
  { email: "marcus@example.com",   name: "Marcus Johnson",  startDate: FIRST_COHORT_DAY_ONE, startWeight: 317, moodAvg: 4.2, sw: 0.05, sk: 0.05 },
  { email: "diane@example.com",    name: "Diane Williams",  startDaysAgo: 41, startWeight: 270, moodAvg: 4.0, sw: 0.05, sk: 0.05 },
  { email: "robert@example.com",   name: "Robert Davis",    startDaysAgo: 12, startWeight: 309, moodAvg: 2.8, sw: 0.30, sk: 0.20 },
  { email: "patricia@example.com", name: "Patricia Chen",   startDaysAgo: 67, startWeight: 240, moodAvg: 4.7, sw: 0.02, sk: 0.02 },
  { email: "james@example.com",    name: "James Carter",    startDaysAgo: 8,  startWeight: 302, moodAvg: 2.2, sw: 0.70, sk: 0.50 },
  { email: "linda@example.com",    name: "Linda Martinez",  startDaysAgo: 55, startWeight: 245, moodAvg: 4.3, sw: 0.05, sk: 0.05 },
];

let _seed = 1234567;
function rand(): number { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; }
function range(min: number, max: number): number { return Math.floor(rand() * (max - min + 1)) + min; }

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
function weekOf(day: number): number { return Math.ceil(day / 7); }

async function seedMessagingIfNeeded(): Promise<void> {
  const staff = first(await db.select().from(schema.staffs).where(eq(schema.staffs.email, STAFF_EMAIL)).limit(1));
  const coach = first(await db.select().from(schema.coaches).where(eq(schema.coaches.email, COACH_EMAIL)).limit(1));
  const marcus = first(await db.select().from(schema.clients).where(eq(schema.clients.email, "marcus@example.com")).limit(1));

  const existingBlast = first(await db.select().from(schema.broadcasts).limit(1));
  if (staff && !existingBlast) {
    await db.insert(schema.broadcasts).values({
      id: randomUUID(),
      staffId: staff.id,
      audience: "all",
      body: "Welcome to the No Excuses Reset Program. Program updates from LoadLine show up here. Your 1:1 with your assigned coach is a separate thread — Staff is not in it.",
    });
    console.log("  + Program broadcast (all users)");
  }

  if (coach && marcus) {
    const existingThread = first(
      await db.select().from(schema.threadMessages)
        .where(eq(schema.threadMessages.clientId, marcus.id)).limit(1),
    );
    if (!existingThread) {
      await db.insert(schema.threadMessages).values([
        {
          id: randomUUID(),
          coachId: coach.id,
          clientId: marcus.id,
          senderRole: "coach",
          body: "Welcome, Marcus. This thread is just you and me — not an AI. Log your days and message me here if you get stuck.",
        },
        {
          id: randomUUID(),
          coachId: coach.id,
          clientId: marcus.id,
          senderRole: "client",
          body: "Got it. See you on Day 1.",
        },
      ]);
      console.log("  + 1:1 thread for Marcus Johnson");
    }
  }
}

async function seedStaffIfNeeded(): Promise<void> {
  const existingStaff = first(await db.select().from(schema.staffs).where(eq(schema.staffs.email, STAFF_EMAIL)).limit(1));
  if (existingStaff) {
    console.log(`Staff ${STAFF_EMAIL} already exists.`);
    return;
  }
  const staffId = randomUUID();
  await db.insert(schema.staffs).values({
    id: staffId,
    email: STAFF_EMAIL,
    passwordHash: hashSync(STAFF_PASSWORD, 10),
    name: "Jesse Collins",
  });
  console.log(`  + Staff: ${STAFF_EMAIL} / ${STAFF_PASSWORD}`);
}

export async function seedDatabase(): Promise<void> {
  console.log("Seeding staff (program ops)...");
  await seedStaffIfNeeded();

  const existing = first(await db.select().from(schema.coaches).where(eq(schema.coaches.email, COACH_EMAIL)).limit(1));
  if (existing) {
    console.log(`Coach ${COACH_EMAIL} already exists. Skipping coach/client seed.`);
    console.log(`(run 'npm run db:reset' to wipe + reseed)`);
    await seedMessagingIfNeeded();
    console.log(`Staff login: ${STAFF_EMAIL} / ${STAFF_PASSWORD}`);
    await pg.end({ timeout: 5 });
    return;
  }

  console.log("Seeding The Ninety 1–90 template...");
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const programRows = [];
  for (let day = 1; day <= 90; day++) {
    const dayOfWeek = dayLabels[(day - 1) % 7];
    const week = weekOf(day);
    const phase = day <= 30 ? "Foundation" : day <= 60 ? "Build" : "Identity";
    const isDeload = week === 4 || week === 8 || week === 12;
    let workout: "A" | "B" | "REST" = "REST";
    if (dayOfWeek === "Mon" || dayOfWeek === "Wed" || dayOfWeek === "Fri") {
      workout = week % 2 === 1 ? "A" : "B";
    }
    const isFastedWalk = dayOfWeek === "Sat";
    const walkMinutes = dayOfWeek === "Sat" ? 60 : dayOfWeek === "Sun" ? 25 : 30;
    programRows.push({ dayNumber: day, workout, phase, weekNumber: week, isDeload, dayLabel: dayOfWeek, isFastedWalk, walkMinutes });
  }
  await db.insert(schema.programDays).values(programRows);
  console.log(`  + ${programRows.length} program days`);

  console.log("Seeding coach...");
  const coachId = randomUUID();
  await db.insert(schema.coaches).values({
    id: coachId, email: COACH_EMAIL, passwordHash: hashSync(COACH_PASSWORD, 10), name: "Jesse Collins",
  });
  console.log(`  + Coach: ${COACH_EMAIL} / ${COACH_PASSWORD}`);

  console.log("Seeding clients + check-ins...");
  const CLIENT_PW = "client-demo";
  const today = todayISODate();
  const yesterday = addDays(today, -1);
  for (const c of CLIENT_SEED) {
    const clientId = randomUUID();
    const startDate = c.startDate ?? isoDaysAgo(c.startDaysAgo ?? 1);
    await db.insert(schema.clients).values({
      id: clientId, coachId, email: c.email, passwordHash: hashSync(CLIENT_PW, 10),
      name: c.name, startDate, startWeightLb: c.startWeight, heightIn: 72, dateOfBirth: "1975-01-15",
      physicianClearedExtendedFasts: c.email === "marcus@example.com", // demo: only Marcus is cleared
      anchorDay: 1, treDays: "[3,5]", resetVariant: "standard_24hr",
    });

    const posToday = getProgramPosition(startDate, today);
    const historyStart = posToday.basicTrainingStartDate;
    const checkinRows = [];
    if (historyStart <= yesterday) {
      for (let date = historyStart; date <= yesterday; date = addDays(date, 1)) {
        const dayPos = getProgramPosition(startDate, date);
        const plan = getDayPlan(dayPos);
        const skipWorkout = rand() < c.sw;
        const skipWalk = rand() < c.sk;
        checkinRows.push({
          id: randomUUID(), clientId, date,
          workoutDone: plan.workout === "REST" ? true : !skipWorkout,
          walkMinutes: skipWalk ? 0 : plan.walkMinutes,
          steps: skipWalk ? range(1500, 3500) : range(6000, 11000),
          proteinG: c.moodAvg < 3 ? range(80, 130) : range(140, 195),
          hydrationOz: c.moodAvg < 3 ? range(40, 70) : range(85, 110),
          mood: Math.max(1, Math.min(5, Math.round(c.moodAvg + (rand() - 0.5) * 1.5))),
          energy: Math.max(1, Math.min(5, Math.round(c.moodAvg + (rand() - 0.5) * 1.5))),
          sleepHours: Math.round((6.5 + rand() * 2) * 10) / 10,
          cpapHours: Math.round((6 + rand() * 2) * 10) / 10,
          notes: rand() < 0.05 ? "Felt a bit tired after squats" : null,
        });
      }
      if (checkinRows.length) await db.insert(schema.dailyCheckins).values(checkinRows);
    }

    const weightRows = [];
    if (startDate <= today) {
      const spanDays = Math.max(1, diffDays(startDate, today));
      const weeks = Math.max(1, Math.ceil(spanDays / 7));
      for (let w = 1; w <= weeks; w++) {
        const date = addDays(startDate, (w - 1) * 7);
        if (date > today) continue;
        const pct = w / weeks;
        weightRows.push({
          id: randomUUID(), clientId, date,
          weightLb: Math.round((c.startWeight - 18 * pct) * 10) / 10,
          waistIn: Math.round((51 - pct * 2) * 10) / 10,
        });
      }
    } else {
      // Still in Basic Training — baseline only, no fake Ninety-scale loss.
      weightRows.push({
        id: randomUUID(), clientId, date: historyStart,
        weightLb: c.startWeight,
        waistIn: 51,
      });
    }
    if (weightRows.length) await db.insert(schema.weights).values(weightRows);
    console.log(`  + ${c.name}: start ${startDate}, ${checkinRows.length} check-ins, ${weightRows.length} weights`);
  }

  await seedMessagingIfNeeded();

  console.log("\nSeed complete.");
  console.log(`Staff login:  ${STAFF_EMAIL} / ${STAFF_PASSWORD}`);
  console.log(`Coach login:  ${COACH_EMAIL} / ${COACH_PASSWORD}`);
  console.log(`Client logins: CLIENT_SEED emails / password "client-demo"`);
  await pg.end({ timeout: 5 });
}

const invokedDirectly =
  process.argv[1]?.includes("seed.ts") || process.argv[1]?.endsWith("seed");

if (invokedDirectly) {
  seedDatabase().catch((e) => { console.error(e); process.exit(1); });
}
