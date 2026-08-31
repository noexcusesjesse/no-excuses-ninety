/**
 * Client daily log — map form fields onto existing daily_checkins + weights columns.
 *
 * Persist path is POST /api/log (same table fasting already writes). This module is
 * the mapping + merge so upsert is testable without Postgres.
 *
 * Rules:
 *   - One row per client per date (application-level find → update or insert).
 *   - Never write fastType / fastStartMs / fastEndMs / fastDurationMs (in-progress
 *     fast on the Dashboard timer must survive a log save).
 *   - Calories have no column — park in notes. Do not invent 365 fields.
 */

export const FASTING_FIELD_KEYS = [
  "fastType",
  "fastStartMs",
  "fastEndMs",
  "fastDurationMs",
] as const;

export type FastingFieldKey = (typeof FASTING_FIELD_KEYS)[number];

export type SessionLike = {
  userId?: string | null;
  role?: string | null;
};

/** Client house only. Coach and Staff sessions must not write a check-in. */
export function clientMayWriteLog(session: SessionLike): boolean {
  return Boolean(session.userId) && session.role === "client";
}

export type DailyLogFormInput = {
  weight?: string | number | null;
  waist?: string | number | null;
  water?: string | number | null;
  hydrationOz?: string | number | null;
  calories?: string | number | null;
  protein?: string | number | null;
  proteinG?: string | number | null;
  steps?: string | number | null;
  fastingHours?: string | number | null;
  exerciseType?: string | null;
  exerciseMinutes?: string | number | null;
  walkMinutes?: string | number | null;
  workoutDone?: string | boolean | null;
  meal1?: string | null;
  meal2?: string | null;
  snack?: string | null;
  powerup?: string | null;
  notes?: string | null;
  mood?: string | number | null;
  energy?: string | number | null;
  sleepHours?: string | number | null;
  cpapHours?: string | number | null;
};

export type CheckinPatch = {
  workoutDone?: boolean;
  walkMinutes?: number;
  steps?: number;
  proteinG?: number;
  hydrationOz?: number;
  mood?: number;
  energy?: number;
  sleepHours?: number;
  cpapHours?: number;
  notes?: string;
};

export type WeightPatch = {
  weightLb?: number;
  waistIn?: number;
};

export type ExistingCheckin = {
  id: string;
  clientId: string;
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
  notes: string | null;
  fastType: string | null;
  fastStartMs: number | null;
  fastEndMs: number | null;
  fastDurationMs: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExistingWeight = {
  id: string;
  clientId: string;
  date: string;
  weightLb: number;
  waistIn: number | null;
};

const CALORIES_LINE = /^Calories:\s*(\d+)\s*$/;
const MEALS_LINE = /^Meals:\s*(.*)$/;

function blank(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

export function parseOptionalNumber(value: unknown): number | undefined {
  if (blank(value)) return undefined;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function parseOptionalInt(value: unknown): number | undefined {
  const n = parseOptionalNumber(value);
  if (n == null) return undefined;
  return Math.round(n);
}

export function parseOptionalBool(value: unknown): boolean | undefined {
  if (value === true || value === false) return value;
  if (blank(value)) return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "yes" || s === "1") return true;
  if (s === "false" || s === "no" || s === "0") return false;
  return undefined;
}

function clampInt(n: number | undefined, min: number, max: number): number | undefined {
  if (n == null) return undefined;
  return Math.min(max, Math.max(min, n));
}

function nonNegativeInt(n: number | undefined): number | undefined {
  if (n == null) return undefined;
  return Math.max(0, n);
}

function nonNegativeNumber(n: number | undefined): number | undefined {
  if (n == null) return undefined;
  return Math.max(0, n);
}

function text(value: unknown): string | undefined {
  if (blank(value)) return undefined;
  return String(value).trim();
}

export type MealFields = {
  meal1?: string;
  meal2?: string;
  snack?: string;
  powerup?: string;
};

export function composeNotes(
  userNotes: string | null | undefined,
  extras: { calories?: number; meals?: MealFields },
): string | undefined {
  const { notes: stripped } = splitParkedNotes(userNotes ?? null);
  const lines: string[] = [];
  if (stripped) lines.push(stripped);

  if (extras.calories != null && Number.isFinite(extras.calories)) {
    lines.push(`Calories: ${Math.round(extras.calories)}`);
  }

  const mealBits: string[] = [];
  if (extras.meals?.meal1) mealBits.push(`Meal 1: ${extras.meals.meal1}`);
  if (extras.meals?.meal2) mealBits.push(`Meal 2: ${extras.meals.meal2}`);
  if (extras.meals?.snack) mealBits.push(`Snack: ${extras.meals.snack}`);
  if (extras.meals?.powerup) mealBits.push(`Power Up: ${extras.meals.powerup}`);
  if (mealBits.length) lines.push(`Meals: ${mealBits.join("; ")}`);

  const joined = lines.join("\n").trim();
  return joined || undefined;
}

function parseMealsLine(line: string): MealFields {
  const meals: MealFields = {};
  for (const part of line.split(";")) {
    const trimmed = part.trim();
    const match = trimmed.match(/^(Meal 1|Meal 2|Snack|Power Up):\s*(.*)$/i);
    if (!match) continue;
    const [, label, value] = match;
    const v = value.trim();
    if (!v) continue;
    const key = label.toLowerCase();
    if (key === "meal 1") meals.meal1 = v;
    else if (key === "meal 2") meals.meal2 = v;
    else if (key === "snack") meals.snack = v;
    else if (key === "power up") meals.powerup = v;
  }
  return meals;
}

export function splitParkedNotes(notes: string | null): {
  notes: string;
  calories?: number;
  meals: MealFields;
} {
  if (!notes) return { notes: "", meals: {} };
  const userLines: string[] = [];
  let calories: number | undefined;
  let meals: MealFields = {};
  for (const raw of notes.split("\n")) {
    const line = raw.trimEnd();
    const cal = line.trim().match(CALORIES_LINE);
    if (cal) {
      calories = Number(cal[1]);
      continue;
    }
    const meal = line.trim().match(MEALS_LINE);
    if (meal) {
      meals = parseMealsLine(meal[1]);
      continue;
    }
    userLines.push(line);
  }
  return { notes: userLines.join("\n").trim(), calories, meals };
}

function mapWorkoutDone(input: DailyLogFormInput): boolean | undefined {
  const explicit = parseOptionalBool(input.workoutDone);
  if (explicit != null) return explicit;
  const type = text(input.exerciseType);
  if (!type) return undefined;
  if (type === "cardio" || type === "strength" || type === "other") return true;
  if (type === "none") return false;
  return undefined;
}

function mapWalkMinutes(input: DailyLogFormInput): number | undefined {
  const explicit = nonNegativeInt(parseOptionalInt(input.walkMinutes));
  if (explicit != null) return explicit;
  const minutes = nonNegativeInt(parseOptionalInt(input.exerciseMinutes));
  if (minutes == null) return undefined;
  const type = text(input.exerciseType);
  if (!type || type === "none" || type === "walking") return minutes;
  return undefined;
}

export function mapFormToPatches(input: DailyLogFormInput): {
  checkin: CheckinPatch;
  weight: WeightPatch;
} {
  const meals: MealFields = {
    meal1: text(input.meal1),
    meal2: text(input.meal2),
    snack: text(input.snack),
    powerup: text(input.powerup),
  };
  const calories = nonNegativeInt(parseOptionalInt(input.calories));
  const notes = composeNotes(text(input.notes) ?? "", { calories, meals });

  const checkin: CheckinPatch = {};
  const workoutDone = mapWorkoutDone(input);
  const walkMinutes = mapWalkMinutes(input);
  const steps = nonNegativeInt(parseOptionalInt(input.steps));
  const proteinG = nonNegativeInt(parseOptionalInt(input.proteinG ?? input.protein));
  const hydrationOz = nonNegativeInt(parseOptionalInt(input.hydrationOz ?? input.water));
  const mood = clampInt(parseOptionalInt(input.mood), 1, 5);
  const energy = clampInt(parseOptionalInt(input.energy), 1, 5);
  const sleepHours = nonNegativeNumber(parseOptionalNumber(input.sleepHours));
  const cpapHours = nonNegativeNumber(parseOptionalNumber(input.cpapHours));

  if (workoutDone != null) checkin.workoutDone = workoutDone;
  if (walkMinutes != null) checkin.walkMinutes = walkMinutes;
  if (steps != null) checkin.steps = steps;
  if (proteinG != null) checkin.proteinG = proteinG;
  if (hydrationOz != null) checkin.hydrationOz = hydrationOz;
  if (mood != null) checkin.mood = mood;
  if (energy != null) checkin.energy = energy;
  if (sleepHours != null) checkin.sleepHours = sleepHours;
  if (cpapHours != null) checkin.cpapHours = cpapHours;
  if (notes != null) checkin.notes = notes;

  const weight: WeightPatch = {};
  const weightLb = nonNegativeNumber(parseOptionalNumber(input.weight));
  const waistIn = nonNegativeNumber(parseOptionalNumber(input.waist));
  if (weightLb != null) weight.weightLb = weightLb;
  if (waistIn != null) weight.waistIn = waistIn;

  return { checkin, weight };
}

export type CheckinUpdateSet = CheckinPatch & { updatedAt: Date };

/** Copy only log columns. Fasting timer fields are not in CheckinPatch. */
export function checkinUpdateSet(patch: CheckinPatch, now: Date): CheckinUpdateSet {
  const set: CheckinUpdateSet = { updatedAt: now };
  if (patch.workoutDone !== undefined) set.workoutDone = patch.workoutDone;
  if (patch.walkMinutes !== undefined) set.walkMinutes = patch.walkMinutes;
  if (patch.steps !== undefined) set.steps = patch.steps;
  if (patch.proteinG !== undefined) set.proteinG = patch.proteinG;
  if (patch.hydrationOz !== undefined) set.hydrationOz = patch.hydrationOz;
  if (patch.mood !== undefined) set.mood = patch.mood;
  if (patch.energy !== undefined) set.energy = patch.energy;
  if (patch.sleepHours !== undefined) set.sleepHours = patch.sleepHours;
  if (patch.cpapHours !== undefined) set.cpapHours = patch.cpapHours;
  if (patch.notes !== undefined) set.notes = patch.notes;
  return set;
}

export function mergeCheckinRow(
  existing: ExistingCheckin,
  patch: CheckinPatch,
  now: Date,
): ExistingCheckin {
  const next: ExistingCheckin = { ...existing, updatedAt: now };
  if (patch.workoutDone !== undefined) next.workoutDone = patch.workoutDone;
  if (patch.walkMinutes !== undefined) next.walkMinutes = patch.walkMinutes;
  if (patch.steps !== undefined) next.steps = patch.steps;
  if (patch.proteinG !== undefined) next.proteinG = patch.proteinG;
  if (patch.hydrationOz !== undefined) next.hydrationOz = patch.hydrationOz;
  if (patch.mood !== undefined) next.mood = patch.mood;
  if (patch.energy !== undefined) next.energy = patch.energy;
  if (patch.sleepHours !== undefined) next.sleepHours = patch.sleepHours;
  if (patch.cpapHours !== undefined) next.cpapHours = patch.cpapHours;
  if (patch.notes !== undefined) next.notes = patch.notes;
  // In-progress (or completed) fast is owned by /api/fasting/today.
  next.fastType = existing.fastType;
  next.fastStartMs = existing.fastStartMs;
  next.fastEndMs = existing.fastEndMs;
  next.fastDurationMs = existing.fastDurationMs;
  return next;
}

export function newCheckinRow(
  patch: CheckinPatch,
  meta: { id: string; clientId: string; date: string; now: Date },
): ExistingCheckin {
  return {
    id: meta.id,
    clientId: meta.clientId,
    date: meta.date,
    workoutDone: patch.workoutDone ?? null,
    walkMinutes: patch.walkMinutes ?? null,
    steps: patch.steps ?? null,
    proteinG: patch.proteinG ?? null,
    hydrationOz: patch.hydrationOz ?? null,
    mood: patch.mood ?? null,
    energy: patch.energy ?? null,
    sleepHours: patch.sleepHours ?? null,
    cpapHours: patch.cpapHours ?? null,
    notes: patch.notes ?? null,
    fastType: null,
    fastStartMs: null,
    fastEndMs: null,
    fastDurationMs: null,
    createdAt: meta.now,
    updatedAt: meta.now,
  };
}

export type CheckinUpsertPlan =
  | { kind: "insert"; row: ExistingCheckin }
  | { kind: "update"; id: string; set: CheckinUpdateSet; row: ExistingCheckin };

/**
 * Idempotent plan: same patch applied twice yields the same row (updatedAt aside
 * on a second update of an already-matching row).
 */
export function planCheckinUpsert(
  existing: ExistingCheckin | null,
  patch: CheckinPatch,
  meta: { id: string; clientId: string; date: string; now: Date },
): CheckinUpsertPlan {
  if (!existing) {
    return { kind: "insert", row: newCheckinRow(patch, meta) };
  }
  return {
    kind: "update",
    id: existing.id,
    set: checkinUpdateSet(patch, meta.now),
    row: mergeCheckinRow(existing, patch, meta.now),
  };
}

export type WeightUpsertPlan =
  | { kind: "skip" }
  | { kind: "insert"; row: { id: string; clientId: string; date: string; weightLb: number; waistIn: number | null } }
  | { kind: "update"; id: string; set: { weightLb?: number; waistIn?: number | null } };

export function planWeightUpsert(
  existing: ExistingWeight | null,
  patch: WeightPatch,
  meta: { id: string; clientId: string; date: string },
): WeightUpsertPlan {
  const hasWeight = patch.weightLb != null;
  const hasWaist = patch.waistIn != null;
  if (!hasWeight && !hasWaist) return { kind: "skip" };

  if (!existing) {
    if (!hasWeight) return { kind: "skip" };
    return {
      kind: "insert",
      row: {
        id: meta.id,
        clientId: meta.clientId,
        date: meta.date,
        weightLb: patch.weightLb as number,
        waistIn: patch.waistIn ?? null,
      },
    };
  }

  const set: { weightLb?: number; waistIn?: number | null } = {};
  if (hasWeight) set.weightLb = patch.weightLb;
  if (hasWaist) set.waistIn = patch.waistIn;
  return { kind: "update", id: existing.id, set };
}

export type TodayLogFormValues = {
  date: string;
  weight: string;
  waist: string;
  water: string;
  calories: string;
  protein: string;
  steps: string;
  walkMinutes: string;
  workoutDone: string;
  mood: string;
  energy: string;
  sleepHours: string;
  cpapHours: string;
  meal1: string;
  meal2: string;
  snack: string;
  powerup: string;
  notes: string;
};

export function emptyLogFormValues(date: string): TodayLogFormValues {
  return {
    date,
    weight: "",
    waist: "",
    water: "",
    calories: "",
    protein: "",
    steps: "",
    walkMinutes: "",
    workoutDone: "",
    mood: "",
    energy: "",
    sleepHours: "",
    cpapHours: "",
    meal1: "",
    meal2: "",
    snack: "",
    powerup: "",
    notes: "",
  };
}

export function formValuesFromRows(
  date: string,
  checkin: ExistingCheckin | null,
  weight: ExistingWeight | null,
): TodayLogFormValues {
  const values = emptyLogFormValues(date);
  if (weight) {
    values.weight = String(weight.weightLb);
    values.waist = weight.waistIn != null ? String(weight.waistIn) : "";
  }
  if (!checkin) return values;
  const parked = splitParkedNotes(checkin.notes);
  values.water = checkin.hydrationOz != null ? String(checkin.hydrationOz) : "";
  values.protein = checkin.proteinG != null ? String(checkin.proteinG) : "";
  values.steps = checkin.steps != null ? String(checkin.steps) : "";
  values.walkMinutes = checkin.walkMinutes != null ? String(checkin.walkMinutes) : "";
  values.workoutDone =
    checkin.workoutDone === true ? "true" : checkin.workoutDone === false ? "false" : "";
  values.mood = checkin.mood != null ? String(checkin.mood) : "";
  values.energy = checkin.energy != null ? String(checkin.energy) : "";
  values.sleepHours = checkin.sleepHours != null ? String(checkin.sleepHours) : "";
  values.cpapHours = checkin.cpapHours != null ? String(checkin.cpapHours) : "";
  values.notes = parked.notes;
  values.calories = parked.calories != null ? String(parked.calories) : "";
  values.meal1 = parked.meals.meal1 ?? "";
  values.meal2 = parked.meals.meal2 ?? "";
  values.snack = parked.meals.snack ?? "";
  values.powerup = parked.meals.powerup ?? "";
  return values;
}
