/**
 * Daily log upsert mapping + merge. Run: npx tsx src/lib/daily-log.test.ts
 *
 * Smoke path for the persist hole: form → patch → idempotent upsert plan,
 * without clobbering an in-progress fast. No Postgres required.
 */
import assert from "node:assert/strict";
import {
  clientMayWriteLog,
  composeNotes,
  FASTING_FIELD_KEYS,
  checkinUpdateSet,
  formValuesFromRows,
  mapFormToPatches,
  mergeCheckinRow,
  planCheckinUpsert,
  planWeightUpsert,
  splitParkedNotes,
  type CheckinPatch,
  type ExistingCheckin,
} from "./daily-log";

const NOW = new Date("2026-08-31T18:00:00Z");
const META = {
  id: "checkin-1",
  clientId: "client-marcus",
  date: "2026-08-31",
  now: NOW,
};

function inProgressFast(overrides: Partial<ExistingCheckin> = {}): ExistingCheckin {
  return {
    id: "checkin-1",
    clientId: "client-marcus",
    date: "2026-08-31",
    workoutDone: null,
    walkMinutes: null,
    steps: null,
    proteinG: null,
    hydrationOz: null,
    mood: null,
    energy: null,
    sleepHours: null,
    cpapHours: null,
    notes: null,
    fastType: "overnight_12_14",
    fastStartMs: 1_700_000_000_000,
    fastEndMs: null,
    fastDurationMs: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

// --- Auth: client session only ---
assert.equal(clientMayWriteLog({ userId: "c1", role: "client" }), true);
assert.equal(clientMayWriteLog({ userId: "coach-1", role: "coach" }), false);
assert.equal(clientMayWriteLog({ userId: "staff-1", role: "staff" }), false);
assert.equal(clientMayWriteLog({ userId: "", role: "client" }), false);
assert.equal(clientMayWriteLog({}), false);

// --- Map only schema fields; park calories; ignore fasting hours ---
const mapped = mapFormToPatches({
  weight: "312.4",
  waist: "50.5",
  water: "96",
  calories: "1800",
  protein: "165",
  steps: "8421",
  fastingHours: "16",
  exerciseType: "walking",
  exerciseMinutes: "35",
  workoutDone: "true",
  mood: "4",
  energy: "3",
  sleepHours: "7.5",
  cpapHours: "6.5",
  meal1: "Eggs and spinach",
  meal2: "Chicken salad",
  snack: "Greek yogurt",
  powerup: "Protein shake",
  notes: "Felt strong on the walk",
});

assert.deepEqual(mapped.checkin, {
  workoutDone: true,
  walkMinutes: 35,
  steps: 8421,
  proteinG: 165,
  hydrationOz: 96,
  mood: 4,
  energy: 3,
  sleepHours: 7.5,
  cpapHours: 6.5,
  notes: [
    "Felt strong on the walk",
    "Calories: 1800",
    "Meals: Meal 1: Eggs and spinach; Meal 2: Chicken salad; Snack: Greek yogurt; Power Up: Protein shake",
  ].join("\n"),
});
assert.deepEqual(mapped.weight, { weightLb: 312.4, waistIn: 50.5 });
assert.equal("fastType" in mapped.checkin, false);
assert.equal("fastStartMs" in mapped.checkin, false);
assert.equal("fastDurationMs" in mapped.checkin, false);

// Empty optional fields are omitted (do not clobber on a later save)
const sparse = mapFormToPatches({ protein: "140", water: "" });
assert.deepEqual(sparse.checkin, { proteinG: 140 });
assert.deepEqual(sparse.weight, {});

// Exercise type cardio/strength/other → workoutDone; walking minutes → walkMinutes
assert.equal(mapFormToPatches({ exerciseType: "strength" }).checkin.workoutDone, true);
assert.equal(mapFormToPatches({ exerciseType: "none" }).checkin.workoutDone, false);
assert.equal(mapFormToPatches({ exerciseType: "walking", exerciseMinutes: "30" }).checkin.walkMinutes, 30);
assert.equal(mapFormToPatches({ exerciseType: "strength", exerciseMinutes: "45" }).checkin.walkMinutes, undefined);
assert.equal(mapFormToPatches({ walkMinutes: "40", exerciseType: "strength", exerciseMinutes: "45" }).checkin.walkMinutes, 40);

// Mood/energy clamp 1–5
assert.equal(mapFormToPatches({ mood: "9" }).checkin.mood, 5);
assert.equal(mapFormToPatches({ energy: "0" }).checkin.energy, 1);

// Calories parked in notes; compose/split round-trip
const parked = composeNotes("Knee twinge", {
  calories: 1900,
  meals: { meal1: "Eggs" },
});
assert.equal(parked, "Knee twinge\nCalories: 1900\nMeals: Meal 1: Eggs");
const split = splitParkedNotes(parked ?? null);
assert.equal(split.notes, "Knee twinge");
assert.equal(split.calories, 1900);
assert.equal(split.meals.meal1, "Eggs");
assert.equal(composeNotes(split.notes, { calories: split.calories, meals: split.meals }), parked);

// --- Upsert: insert when missing ---
const insertPlan = planCheckinUpsert(null, mapped.checkin, META);
assert.equal(insertPlan.kind, "insert");
if (insertPlan.kind !== "insert") throw new Error("expected insert");
assert.equal(insertPlan.row.clientId, "client-marcus");
assert.equal(insertPlan.row.date, "2026-08-31");
assert.equal(insertPlan.row.proteinG, 165);
assert.equal(insertPlan.row.fastType, null);
assert.equal(insertPlan.row.fastStartMs, null);

// --- Upsert: update must not clobber an in-progress fast ---
const existing = inProgressFast();
const updatePlan = planCheckinUpsert(existing, mapped.checkin, META);
assert.equal(updatePlan.kind, "update");
if (updatePlan.kind !== "update") throw new Error("expected update");
assert.equal(updatePlan.row.fastType, "overnight_12_14");
assert.equal(updatePlan.row.fastStartMs, 1_700_000_000_000);
assert.equal(updatePlan.row.fastEndMs, null);
assert.equal(updatePlan.row.fastDurationMs, null);
assert.equal(updatePlan.row.proteinG, 165);
assert.equal(updatePlan.row.hydrationOz, 96);
for (const key of FASTING_FIELD_KEYS) {
  assert.equal(key in updatePlan.set, false, `update set must not include ${key}`);
}
assert.equal("id" in updatePlan.set, false);
assert.equal("clientId" in updatePlan.set, false);
assert.equal("date" in updatePlan.set, false);

// Poison patch keys must still be stripped from the SQL set
const poisonedSet = checkinUpdateSet(
  { ...mapped.checkin, fastType: "reset_24hr", fastStartMs: 99 } as CheckinPatch,
  NOW,
);
for (const key of FASTING_FIELD_KEYS) {
  assert.equal(key in poisonedSet, false);
}

const merged = mergeCheckinRow(
  existing,
  { proteinG: 150, notes: "hello" },
  NOW,
);
assert.equal(merged.fastType, existing.fastType);
assert.equal(merged.fastStartMs, existing.fastStartMs);
assert.equal(merged.proteinG, 150);

function withoutTimestamps(row: ExistingCheckin) {
  const copy: Partial<ExistingCheckin> = { ...row };
  delete copy.updatedAt;
  delete copy.createdAt;
  return copy;
}

// --- Idempotent: applying the same patch twice yields the same row ---
const first = planCheckinUpsert(null, mapped.checkin, META);
assert.equal(first.kind, "insert");
if (first.kind !== "insert") throw new Error("expected insert");
const second = planCheckinUpsert(first.row, mapped.checkin, { ...META, now: new Date("2026-08-31T19:00:00Z") });
assert.equal(second.kind, "update");
if (second.kind !== "update") throw new Error("expected update");
assert.deepEqual(withoutTimestamps(second.row), withoutTimestamps(first.row));

// Partial second save does not wipe protein
const afterProtein = planCheckinUpsert(first.row, { steps: 9000 }, META);
assert.equal(afterProtein.row.proteinG, 165);
assert.equal(afterProtein.row.steps, 9000);
assert.equal(afterProtein.row.fastType, null);

// Fasting-created row + log save keeps the timer
const fastingRow = inProgressFast({ proteinG: null });
const afterLog = planCheckinUpsert(fastingRow, { proteinG: 170, hydrationOz: 80 }, META);
assert.equal(afterLog.row.fastStartMs, fastingRow.fastStartMs);
assert.equal(afterLog.row.proteinG, 170);

// --- Weights: skip when empty; require weightLb on insert; upsert when present ---
assert.equal(planWeightUpsert(null, {}, { id: "w1", clientId: "c1", date: "2026-08-31" }).kind, "skip");
assert.equal(planWeightUpsert(null, { waistIn: 50 }, { id: "w1", clientId: "c1", date: "2026-08-31" }).kind, "skip");
const wInsert = planWeightUpsert(null, { weightLb: 312.4, waistIn: 50.5 }, { id: "w1", clientId: "c1", date: "2026-08-31" });
assert.equal(wInsert.kind, "insert");
if (wInsert.kind !== "insert") throw new Error("expected weight insert");
assert.equal(wInsert.row.weightLb, 312.4);
assert.equal(wInsert.row.waistIn, 50.5);

const wExisting = { id: "w1", clientId: "c1", date: "2026-08-31", weightLb: 312.4, waistIn: 50.5 };
const wUpdate = planWeightUpsert(wExisting, { weightLb: 311.8 }, { id: "w2", clientId: "c1", date: "2026-08-31" });
assert.equal(wUpdate.kind, "update");
if (wUpdate.kind !== "update") throw new Error("expected weight update");
assert.deepEqual(wUpdate.set, { weightLb: 311.8 });
assert.equal(wUpdate.id, "w1");

const wWaistOnly = planWeightUpsert(wExisting, { waistIn: 49.9 }, { id: "w2", clientId: "c1", date: "2026-08-31" });
assert.equal(wWaistOnly.kind, "update");
if (wWaistOnly.kind !== "update") throw new Error("expected waist update");
assert.deepEqual(wWaistOnly.set, { waistIn: 49.9 });

const wAgain = planWeightUpsert(wExisting, { weightLb: 312.4, waistIn: 50.5 }, { id: "w2", clientId: "c1", date: "2026-08-31" });
assert.equal(wAgain.kind, "update");
if (wAgain.kind !== "update") throw new Error("expected idempotent weight update");
assert.deepEqual(wAgain.set, { weightLb: 312.4, waistIn: 50.5 });

// Form round-trip: parked calories/meals come back as their own fields
const form = formValuesFromRows("2026-08-31", first.row, {
  id: "w1",
  clientId: "client-marcus",
  date: "2026-08-31",
  weightLb: 312.4,
  waistIn: 50.5,
});
assert.equal(form.protein, "165");
assert.equal(form.water, "96");
assert.equal(form.calories, "1800");
assert.equal(form.notes, "Felt strong on the walk");
assert.equal(form.meal1, "Eggs and spinach");
assert.equal(form.weight, "312.4");
assert.equal(form.workoutDone, "true");

const remapped = mapFormToPatches(form);
assert.equal(remapped.checkin.notes, mapped.checkin.notes);
assert.equal(remapped.checkin.proteinG, 165);

console.log("daily-log tests passed");
