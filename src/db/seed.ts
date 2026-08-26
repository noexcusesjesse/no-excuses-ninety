/**
 * Seed the DB with: 1 coach, 6 clients, the 90-day program template,
 * and daily check-ins per client.
 *
 * Run: npm run db:seed (after npm run db:migrate)
 * Idempotent: existing coach with seed email skips seed.
 */
import { db, schema } from "./client";
import { sql } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { randomUUID } from "node:crypto";

const COACH_EMAIL = "coach@loadlinefitness.com";
const COACH_PASSWORD = "loadline-demo";

const CLIENT_SEED = [
  { email: "marcus@example.com",   name: "Marcus Johnson",  startDaysAgo: 23, startWeight: 317, moodAvg: 4.2, sw: 0.05, sk: 0.05 },
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

export async function seedDatabase(): Promise<void> {
  const existing = db.select().from(schema.coaches).where(sql`email = ${COACH_EMAIL}`).get();
  if (existing) {
    console.log(`Coach ${COACH_EMAIL} already exists. Skipping seed.`);
    console.log(`(run 'npm run db:reset' to wipe + reseed)`);
    return;
  }

  console.log("Seeding 90-day program template...");
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
  db.insert(schema.programDays).values(programRows).run();
  console.log(`  + ${programRows.length} program days`);

  console.log("Seeding coach...");
  const coachId = randomUUID();
  db.insert(schema.coaches).values({
    id: coachId, email: COACH_EMAIL, passwordHash: hashSync(COACH_PASSWORD, 10), name: "Jesse Collins",
  }).run();
  console.log(`  + Coach: ${COACH_EMAIL} / ${COACH_PASSWORD}`);

  console.log("Seeding clients + check-ins...");
  const CLIENT_PW = "client-demo";
  for (const c of CLIENT_SEED) {
    const clientId = randomUUID();
    db.insert(schema.clients).values({
      id: clientId, coachId, email: c.email, passwordHash: hashSync(CLIENT_PW, 10),
      name: c.name, startDate: isoDaysAgo(c.startDaysAgo), startWeightLb: c.startWeight, heightIn: 72, dateOfBirth: "1975-01-15",
      physicianClearedExtendedFasts: c.email === "marcus@example.com", // demo: only Marcus is cleared
      anchorDay: 1, treDays: "[3,5]", resetVariant: "standard_24hr",
    }).run();

    const checkinRows = [];
    for (let i = c.startDaysAgo; i >= 1; i--) {
      const date = isoDaysAgo(i);
      const dayNum = c.startDaysAgo - i + 1;
      const programDay = db.select().from(schema.programDays).where(sql`day_number = ${dayNum}`).get();
      const skipWorkout = rand() < c.sw;
      const skipWalk = rand() < c.sk;
      checkinRows.push({
        id: randomUUID(), clientId, date,
        workoutDone: programDay?.workout === "REST" ? true : !skipWorkout,
        walkMinutes: skipWalk ? 0 : (programDay?.walkMinutes ?? 30),
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
    db.insert(schema.dailyCheckins).values(checkinRows).run();

    const weightRows = [];
    for (let w = 1; w <= Math.ceil(c.startDaysAgo / 7); w++) {
      const daysAgo = c.startDaysAgo - (w - 1) * 7;
      if (daysAgo < 1) continue;
      const pct = w / Math.ceil(c.startDaysAgo / 7);
      weightRows.push({
        id: randomUUID(), clientId, date: isoDaysAgo(daysAgo),
        weightLb: Math.round((c.startWeight - (c.startWeight - (c.startWeight - 18)) * pct) * 10) / 10,
        waistIn: Math.round((51 - pct * 2) * 10) / 10,
      });
    }
    db.insert(schema.weights).values(weightRows).run();
    console.log(`  + ${c.name}: ${checkinRows.length} check-ins, ${weightRows.length} weights`);
  }
  console.log("\nSeed complete.");
  console.log(`Coach login: ${COACH_EMAIL} / ${COACH_PASSWORD}`);
  console.log(`Client logins: CLIENT_SEED emails / password "client-demo"`);
}

seedDatabase().catch((e) => { console.error(e); process.exit(1); });
