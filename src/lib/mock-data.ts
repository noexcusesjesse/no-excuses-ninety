/**
 * Mock data for Sprint 0. All of this will be replaced by SQLite-backed
 * queries in Sprint 1. Kept here so we can iterate on the visual direction
 * without a database in the loop.
 *
 * Program structure derived from /home/markusbot/no-excuses-ninety/PROGRAM_REVISED.md
 */

export type WorkoutLetter = "A" | "B" | "REST";

export interface DailyPlan {
  /** ISO day, e.g. "2026-08-25" */
  date: string;
  /** Day-of-week label */
  dayLabel: string;
  /** Workout assigned today */
  workout: WorkoutLetter;
  /** Walking target in minutes */
  walkMinutes: number;
  /** Is the Saturday 1-hour fasted walk? */
  isFastedWalk: boolean;
  /** Day-of-program counter, e.g. "Day 23 of 90" */
  programDay: number;
  /** Current phase */
  phase: "Foundation" | "Build" | "Identity";
  /** Is this a deload week? */
  isDeload: boolean;
}

export interface ClientToday {
  /** Display name */
  name: string;
  /** "Day X of 90" */
  programDay: number;
  /** Current week number 1-13 */
  weekNumber: number;
  /** Current phase */
  phase: "Foundation" | "Build" | "Identity";
  /** Today's plan */
  plan: DailyPlan;
  /** Days into current streak (workouts done) */
  workoutStreak: number;
  /** Days into current streak (walks done) */
  walkStreak: number;
  /** Protein today, grams */
  proteinToday: number;
  /** Protein target */
  proteinTarget: number;
  /** Hydration today, oz */
  hydrationOz: number;
  /** Hydration target, oz */
  hydrationTarget: number;
  /** Steps today */
  stepsToday: number;
  /** Steps target */
  stepsTarget: number;
  /** Sleep last night, hours */
  sleepHours: number;
  /** CPAP hours last night */
  cpapHours: number;
  /** Mood today 1-5 */
  mood: number | null;
  /** Energy today 1-5 */
  energy: number | null;
}

const MOCK_CLIENT: ClientToday = {
  name: "Marcus",
  programDay: 23,
  weekNumber: 4,
  phase: "Foundation",
  plan: {
    date: "2026-08-24",
    dayLabel: "Monday",
    workout: "A",
    walkMinutes: 30,
    isFastedWalk: false,
    programDay: 23,
    phase: "Foundation",
    isDeload: false,
  },
  workoutStreak: 4,
  walkStreak: 18,
  proteinToday: 95,
  proteinTarget: 170,
  hydrationOz: 64,
  hydrationTarget: 100,
  stepsToday: 4200,
  stepsTarget: 7000,
  sleepHours: 6.5,
  cpapHours: 6.5,
  mood: null,
  energy: null,
};

export const WORKOUT_A = [
  { name: "Sit-to-stand / squat", reps: "8–12", band: "bodyweight → medium" },
  { name: "Door-anchor chest press", reps: "10–12", band: "light" },
  { name: "Door-anchor row", reps: "10–12", band: "medium" },
  { name: "Glute bridge", reps: "10–15", band: "bodyweight → light/medium" },
  { name: "Face pull or pull-apart", reps: "12–15", band: "light" },
  { name: "Dead bug", reps: "6–8/side", band: "no band / lightest" },
];

export const WORKOUT_B = [
  { name: "Sit-to-stand", reps: "8–12", band: "bodyweight → medium" },
  { name: "Band Romanian deadlift", reps: "10–12", band: "medium or heavy" },
  { name: "Ankle-strap kickback", reps: "10/side", band: "light" },
  { name: "Incline or knee push-up", reps: "6–12", band: "no band" },
  { name: "Door-anchor face pull", reps: "12–15", band: "light" },
  { name: "Bird-dog", reps: "6–8/side", band: "no band" },
];

export interface CoachClient {
  id: string;
  name: string;
  avatar: string; // initials
  programDay: number;
  weekNumber: number;
  phase: "Foundation" | "Build" | "Identity";
  /** Last check-in date (relative, e.g. "2h ago") */
  lastCheckIn: string;
  /** 7-day workout completion %, 0-100 */
  workoutCompletion: number;
  /** 7-day walk completion %, 0-100 */
  walkCompletion: number;
  /** Average protein hit rate, 0-100 */
  proteinHitRate: number;
  /** Trend: weight change last 7 days, lbs */
  weightTrend7d: number;
  /** On track / slipping / off */
  status: "on-track" | "slipping" | "off";
  /** Latest weight, lb */
  currentWeight: number;
  /** Mood avg last 7 days, 1-5 */
  moodAvg: number;
}

export const COACH_CLIENTS: CoachClient[] = [
  {
    id: "c1",
    name: "Marcus Johnson",
    avatar: "MJ",
    programDay: 23,
    weekNumber: 4,
    phase: "Foundation",
    lastCheckIn: "2h ago",
    workoutCompletion: 100,
    walkCompletion: 86,
    proteinHitRate: 90,
    weightTrend7d: -1.8,
    status: "on-track",
    currentWeight: 273,
    moodAvg: 4.2,
  },
  {
    id: "c2",
    name: "Diane Williams",
    avatar: "DW",
    programDay: 41,
    weekNumber: 6,
    phase: "Build",
    lastCheckIn: "Yesterday",
    workoutCompletion: 86,
    walkCompletion: 100,
    proteinHitRate: 78,
    weightTrend7d: -0.9,
    status: "on-track",
    currentWeight: 244,
    moodAvg: 4.0,
  },
  {
    id: "c3",
    name: "Robert Davis",
    avatar: "RD",
    programDay: 12,
    weekNumber: 2,
    phase: "Foundation",
    lastCheckIn: "3 days ago",
    workoutCompletion: 43,
    walkCompletion: 71,
    proteinHitRate: 52,
    weightTrend7d: +0.4,
    status: "slipping",
    currentWeight: 311,
    moodAvg: 2.8,
  },
  {
    id: "c4",
    name: "Patricia Chen",
    avatar: "PC",
    programDay: 67,
    weekNumber: 10,
    phase: "Identity",
    lastCheckIn: "5h ago",
    workoutCompletion: 100,
    walkCompletion: 100,
    proteinHitRate: 95,
    weightTrend7d: -2.1,
    status: "on-track",
    currentWeight: 198,
    moodAvg: 4.7,
  },
  {
    id: "c5",
    name: "James Carter",
    avatar: "JC",
    programDay: 8,
    weekNumber: 2,
    phase: "Foundation",
    lastCheckIn: "—",
    workoutCompletion: 14,
    walkCompletion: 28,
    proteinHitRate: 38,
    weightTrend7d: +0.8,
    status: "off",
    currentWeight: 304,
    moodAvg: 2.2,
  },
  {
    id: "c6",
    name: "Linda Martinez",
    avatar: "LM",
    programDay: 55,
    weekNumber: 8,
    phase: "Build",
    lastCheckIn: "1h ago",
    workoutCompletion: 93,
    walkCompletion: 100,
    proteinHitRate: 82,
    weightTrend7d: -1.4,
    status: "on-track",
    currentWeight: 221,
    moodAvg: 4.3,
  },
];

export function getMockClient(): ClientToday {
  return MOCK_CLIENT;
}

export function getWorkout(letter: WorkoutLetter) {
  return letter === "A" ? WORKOUT_A : letter === "B" ? WORKOUT_B : [];
}