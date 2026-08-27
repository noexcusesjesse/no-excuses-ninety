/**
 * No Excuses Reset Program — DB schema (Drizzle + SQLite)
 *
 * Tables:
 *   coaches       — accounts that own client rosters
 *   clients       — the people being coached (1 coach owns many)
 *   program_days  — The Ninety template (Day 1-90, A/B/rest, phase, deload)
 *   daily_checkins — one row per client per day: workout, walk, mood, energy, sleep, protein, hydration, fasting
 *   weights       — weekly weight log (separate from daily because cadence is weekly not daily)
 *   audit_log     — coach actions (notes, band adjustments, etc.)
 *
 * 15-month program position is computed from clients.startDate (Day 1 of The Ninety)
 * in src/lib/program-position.ts — not stored as extra rows. Basic Training is the
 * 14 days before startDate. program_days stays 1–90 for The Ninety only.
 *
 * Phase 2 additions:
 *   - clients.physicianClearedExtendedFasts — required for 24h/36h, still gated by month
 *   - clients.anchorDay / treDays / resetVariant — per-client fasting settings
 *   - daily_checkins.fastType / fastStartMs / fastEndMs / fastDurationMs — fasting log
 */
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const coaches = sqliteTable("coaches", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  coachId: text("coach_id")
    .notNull()
    .references(() => coaches.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  /** Day 1 of The Ninety (ISO "YYYY-MM-DD"). Basic Training is the 14 days before this date. */
  startDate: text("start_date").notNull(),
  /** Start weight in lbs. */
  startWeightLb: real("start_weight_lb").notNull(),
  /** Height in inches (for BMI calculations if coach wants them). */
  heightIn: real("height_in"),
  /** Date of birth ISO. Used for age + physician clearance reminders. */
  dateOfBirth: text("date_of_birth"),
  /** Physician cleared for extended fasts (24h+). Gates 24h/36h fast options. */
  physicianClearedExtendedFasts: integer("physician_cleared_extended", { mode: "boolean" })
    .notNull()
    .default(false),
  /** Fasting anchor day (0=Sun...6=Sat). Default 1 (Monday). */
  anchorDay: integer("anchor_day").notNull().default(1),
  /** TRE days as JSON array string, e.g. "[3,5]" for Wed+Fri. */
  treDays: text("tre_days").notNull().default("[3,5]"),
  /** Reset day variant: "standard_24hr" or "extended_36hr". Month-gated (24h from month 7, 36h from month 8). */
  resetVariant: text("reset_variant").notNull().default("standard_24hr"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * program_days — The Ninety template (days 1–90).
 * Seeded once at deploy time. Position after Day 90 is computed in program-position.ts
 * and does not require extra workout rows.
 * Days 1-30 = Foundation, 31-60 = Build, 61-90 = Identity.
 * Deload weeks at 4, 8, 12.
 */
export const programDays = sqliteTable("program_days", {
  /** Day number, 1-90. */
  dayNumber: integer("day_number").primaryKey(),
  /** "A", "B", or "REST". */
  workout: text("workout").notNull(),
  /** "Foundation" | "Build" | "Identity". */
  phase: text("phase").notNull(),
  /** Week number 1-13. */
  weekNumber: integer("week_number").notNull(),
  /** 1 if this is a deload week (lightest bands, 1 round). */
  isDeload: integer("is_deload", { mode: "boolean" }).notNull().default(false),
  /** Day of week label for this day number (Mon, Tue, ...). */
  dayLabel: text("day_label").notNull(),
  /** 1 if Saturday fasted 60-min walk, else regular walk minutes. */
  isFastedWalk: integer("is_fasted_walk", { mode: "boolean" }).notNull().default(false),
  walkMinutes: integer("walk_minutes").notNull().default(30),
});

export const dailyCheckins = sqliteTable("daily_checkins", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  /** ISO date "YYYY-MM-DD". Unique per client — one check-in per day. */
  date: text("date").notNull(),
  /** 1 if completed, 0 if skipped. NULL if not yet logged. */
  workoutDone: integer("workout_done", { mode: "boolean" }),
  /** Walk completed minutes. NULL if not yet logged. */
  walkMinutes: integer("walk_minutes"),
  /** Steps logged (manual entry for Sprint 1). */
  steps: integer("steps"),
  /** Protein grams for the day. */
  proteinG: integer("protein_g"),
  /** Hydration ounces. */
  hydrationOz: integer("hydration_oz"),
  /** Mood 1-5. */
  mood: integer("mood"),
  /** Energy 1-5. */
  energy: integer("energy"),
  /** Sleep hours last night. */
  sleepHours: real("sleep_hours"),
  /** CPAP hours last night. */
  cpapHours: real("cpap_hours"),
  /** Free-form notes ("felt dizzy after squats", etc.). */
  notes: text("notes"),

  // Fasting log fields (Phase 2)
  /** Fast type for this day: "overnight_12_14" | "tre_16_8" | "reset_24hr" | "pre_14_10" | "pre_12_12" */
  fastType: text("fast_type"),
  /** Fast start time (epoch ms). */
  fastStartMs: integer("fast_start_ms"),
  /** Fast end time (epoch ms). */
  fastEndMs: integer("fast_end_ms"),
  /** Fast duration in ms. */
  fastDurationMs: integer("fast_duration_ms"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const weights = sqliteTable("weights", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  /** ISO date "YYYY-MM-DD". Weekly cadence but unique constraint is per-date for simplicity. */
  date: text("date").notNull(),
  weightLb: real("weight_lb").notNull(),
  /** Waist measurement in inches, optional. */
  waistIn: real("waist_in"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  /** Coach who took the action. */
  coachId: text("coach_id")
    .notNull()
    .references(() => coaches.id, { onDelete: "cascade" }),
  /** Client the action was about (nullable for general coach actions). */
  clientId: text("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  /** "note_added" | "band_adjusted" | "program_started" | ... */
  action: text("action").notNull(),
  /** Free-form details (JSON or plain text). */
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Coach = typeof coaches.$inferSelect;
export type NewCoach = typeof coaches.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ProgramDay = typeof programDays.$inferSelect;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type NewDailyCheckin = typeof dailyCheckins.$inferInsert;
export type Weight = typeof weights.$inferSelect;
export type NewWeight = typeof weights.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
