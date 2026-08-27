/**
 * Monthly review helper — determines month status from logged data.
 * Protocol months are 30-day cycles; this is a monthly tool, not "the program."
 *
 * From the build brief (Specs/app-build-brief.md §5):
 *   Compute weekly_rate = weight_change_over_cycle / days_in_cycle × 7
 *   (negative = loss)
 *
 *   Weight increased        → REVIEW REQUIRED (bad)
 *   Loss > 2.0 lb/week      → FASTER THAN TARGET (warn)
 *   Loss 0.75–2.0 lb/week   → ON TRACK (good)
 *   Loss 0–0.75 lb/week     → SLOWER THAN TARGET (warn)
 *   Insufficient data       → NOT ENOUGH DATA (warn)
 *
 * This logic must never be bypassed or auto-applied without the user
 * reviewing it — it informs, it doesn't act unilaterally.
 */

export type DecisionStatus =
  | "review_required"
  | "faster_than_target"
  | "on_track"
  | "slower_than_target"
  | "not_enough_data";

export interface DecisionResult {
  status: DecisionStatus;
  label: string;
  description: string;
  variant: "good" | "warn" | "bad";
}

export interface CycleData {
  startWeight: number;
  currentWeight: number;
  weightChange: number;
  daysInCycle: number;
  loggedDays: number;
}

export function computeWeeklyRate(data: CycleData): number {
  if (data.daysInCycle === 0) return 0;
  return (data.weightChange / data.daysInCycle) * 7;
}

export function runDecisionEngine(data: CycleData): DecisionResult {
  const { weightChange, daysInCycle, loggedDays } = data;

  // Not enough data — need at least 7 logged days
  if (loggedDays < 7 || daysInCycle < 7) {
    return {
      status: "not_enough_data",
      label: "Not enough data",
      description:
        "Log at least 7 days of data before drawing conclusions. Keep logging — the trend will emerge.",
      variant: "warn",
    };
  }

  const weeklyRate = computeWeeklyRate(data);

  // Weight increased over the cycle
  if (weightChange > 0) {
    return {
      status: "review_required",
      label: "Review required",
      description:
        "Weight increased over this cycle. Review actual calorie intake, activity, medication changes, water retention, dietary consistency, and sleep. Consider a clinician check-in if this continues.",
      variant: "bad",
    };
  }

  // Loss > 2.0 lb/week — too fast
  if (weeklyRate < -2.0) {
    return {
      status: "faster_than_target",
      label: "Faster than target",
      description:
        "Weight loss is exceeding 2 lb/week. Do NOT congratulate automatically. Review nutrition, hydration, protein, and energy. Consider discussing intake/medication with your clinician before changing anything.",
      variant: "warn",
    };
  }

  // Loss 0.75–2.0 lb/week — on track
  if (weeklyRate <= -0.75) {
    return {
      status: "on_track",
      label: "On track",
      description:
        "No reason to change calories — keep the current target. You're losing at a sustainable rate.",
      variant: "good",
    };
  }

  // Loss 0–0.75 lb/week — slower than target
  if (weeklyRate < 0) {
    return {
      status: "slower_than_target",
      label: "Slower than target",
      description:
        "First check intake accuracy, portions, protein, steps, fasting adherence, and weekend intake. Only consider a modest adjustment if those all check out — never a drastic cut.",
      variant: "warn",
    };
  }

  // No change at all
  return {
    status: "slower_than_target",
    label: "Slower than target",
    description:
      "Weight has not changed. Check intake accuracy, portions, protein, steps, fasting adherence. A modest adjustment may help — but never a drastic cut.",
    variant: "warn",
  };
}

/**
 * BMR via Mifflin-St Jeor equation.
 * men:  10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5
 * women: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
 */
export function calculateBMR(
  weightLb: number,
  heightIn: number,
  ageYears: number,
  sex: "male" | "female",
): number {
  const weightKg = weightLb / 2.2046;
  const heightCm = heightIn * 2.54;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

/**
 * TDEE = BMR × activity multiplier.
 */
export function calculateTDEE(bmr: number, activityLevel: number): number {
  return Math.round(bmr * activityLevel);
}

/**
 * Goal projection: estimate weeks to goal.
 * Uses the average weekly rate from the current cycle (or a safe default).
 */
export function projectWeeksToGoal(
  currentWeight: number,
  goalWeight: number,
  weeklyRateLb: number,
): number | null {
  if (weeklyRateLb >= 0) return null; // can't project if not losing
  const lbsToGo = currentWeight - goalWeight;
  if (lbsToGo <= 0) return 0;
  return Math.ceil(lbsToGo / Math.abs(weeklyRateLb));
}
