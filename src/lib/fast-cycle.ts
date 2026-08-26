/**
 * Fasting cycle logic — ported from the Reset Regime prototype.
 *
 * Calendar-week-locked cycle: Reset Day + TRE days + overnight fasts.
 * The anchor day cannot also be a TRE day.
 *
 * Physician clearance gate:
 *   - 24h Reset Day: only available if client.physicianClearedExtendedFasts is true
 *   - 36h extended variant: same gate, plus a confirmation step in the UI
 *   - 90-day protocol default: 14:10/16:8 + overnight fasting only
 *
 * See Specs/fast-cycle-spec.md (originally no-excuses-reset-regime-build-doc.md)
 * for the full design rationale.
 */

export type FastType =
  | "overnight_12_14"
  | "tre_16_8"
  | "reset_24hr"
  | "pre_14_10"
  | "pre_12_12";

export interface FastingSettings {
  /** Anchor day (0=Sun...6=Sat). Default 1 (Monday). */
  anchorDay: number;
  /** TRE day indices (up to 2). */
  treDays: number[];
  /** "standard_24hr" or "extended_36hr". */
  resetVariant: "standard_24hr" | "extended_36hr";
  /** Physician cleared for extended fasts (24h+). */
  physicianClearedExtendedFasts: boolean;
}

export interface PreRamp {
  /** Target anchor date (ISO "YYYY-MM-DD"). */
  targetAnchorDate: string;
}

export const FAST_TYPE_META: Record<
  FastType,
  { label: string; targetHours: number; maxHours: number; color: string }
> = {
  reset_24hr: { label: "Reset Day (24h)", targetHours: 24, maxHours: 24, color: "#b5654a" },
  tre_16_8: { label: "16:8 TRE", targetHours: 16, maxHours: 16, color: "#4f8f83" },
  overnight_12_14: { label: "Overnight (12–14h)", targetHours: 13, maxHours: 14, color: "#5a7fa6" },
  pre_14_10: { label: "Pre-Phase (14:10)", targetHours: 14, maxHours: 14, color: "#c99a4b" },
  pre_12_12: { label: "Pre-Phase (12:12)", targetHours: 12, maxHours: 12, color: "#c99a4b" },
};

/**
 * Resolve a date's fast type.
 *
 * Priority:
 * 1. Pre-Phase ramp override (if preRamp is active and date is before targetAnchorDate)
 * 2. Anchor day → reset_24hr (or overnight if not physician-cleared)
 * 3. TRE day → tre_16_8
 * 4. Everything else → overnight_12_14
 */
export function getDayType(
  date: Date,
  settings: FastingSettings,
  preRamp: PreRamp | null,
): FastType {
  const dateISO = date.toISOString().slice(0, 10);

  // Pre-Phase ramp override
  if (preRamp && dateISO < preRamp.targetAnchorDate) {
    // The day immediately before the target anchor date → 12:12
    const dayBeforeTarget = new Date(preRamp.targetAnchorDate + "T00:00:00");
    dayBeforeTarget.setDate(dayBeforeTarget.getDate() - 1);
    if (dateISO === dayBeforeTarget.toISOString().slice(0, 10)) {
      return "pre_12_12";
    }
    return "pre_14_10";
  }

  // On or after target anchor date → fall through to normal weekly cycle
  // (the preRamp should have been cleared by clearExpiredRamp, but this
  // is a safety net)

  const dow = date.getDay(); // 0=Sun...6=Sat

  if (dow === settings.anchorDay) {
    // Reset Day — but only if physician-cleared for extended fasts
    if (settings.physicianClearedExtendedFasts) {
      return "reset_24hr";
    }
    // Not cleared — downgrade to a longer overnight fast (16h)
    return "tre_16_8";
  }

  if (settings.treDays.includes(dow)) {
    return "tre_16_8";
  }

  return "overnight_12_14";
}

/**
 * Get target hours for a fast type, respecting the reset variant.
 */
export function getTargetHours(
  type: FastType,
  settings: FastingSettings,
): number {
  if (type === "reset_24hr") {
    return settings.resetVariant === "extended_36hr" ? 36 : 24;
  }
  return FAST_TYPE_META[type].targetHours;
}

/**
 * Get max hours for a fast type.
 */
export function getMaxHours(
  type: FastType,
  settings: FastingSettings,
): number {
  if (type === "reset_24hr") {
    return settings.resetVariant === "extended_36hr" ? 36 : 24;
  }
  return FAST_TYPE_META[type].maxHours;
}

/**
 * Compute the Pre-Phase ramp target date.
 *
 * daysUntil = (anchorDay - today.getDay() + 7) % 7
 * If daysUntil === 0 (today IS the anchor day), target NEXT week's anchor.
 */
export function computePreRamp(anchorDay: number): PreRamp {
  const today = new Date();
  let daysUntil = (anchorDay - today.getDay() + 7) % 7;
  if (daysUntil === 0) daysUntil = 7;

  const target = new Date();
  target.setDate(target.getDate() + daysUntil);
  return { targetAnchorDate: target.toISOString().slice(0, 10) };
}

/**
 * Check if a pre-ramp has expired (today's date > targetAnchorDate).
 */
export function isPreRampExpired(
  preRamp: PreRamp | null,
): boolean {
  if (!preRamp) return true;
  const today = new Date().toISOString().slice(0, 10);
  return today > preRamp.targetAnchorDate;
}

/**
 * Get the last N anchor day dates (counting back from today).
 */
export function getPastAnchorDates(
  n: number,
  anchorDay: number,
): Date[] {
  const dates: Date[] = [];
  let daysBack = 0;
  while (dates.length < n) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    if (d.getDay() === anchorDay) {
      dates.push(d);
    }
    daysBack++;
    if (daysBack > 365) break; // safety
  }
  return dates;
}

/**
 * Check if a Reset Day was completed.
 * A Reset Day counts as completed if:
 *   - A log entry exists with type === "reset_24hr"
 *   - AND the entry's end date matches the anchor date
 *   - AND the duration was >= 20 hours
 */
export function wasResetCompleted(
  anchorDate: Date,
  logs: Array<{ fastType: string; fastEndMs: number; fastDurationMs: number }>,
): boolean {
  const anchorISO = anchorDate.toISOString().slice(0, 10);
  const twentyHoursMs = 20 * 60 * 60 * 1000;

  return logs.some(
    (log) =>
      log.fastType === "reset_24hr" &&
      new Date(log.fastEndMs).toISOString().slice(0, 10) === anchorISO &&
      log.fastDurationMs >= twentyHoursMs,
  );
}

/**
 * Compute streaks for the coaching UI.
 * Walks backward from yesterday through the last 6 anchor days.
 */
export function computeStreaks(
  settings: FastingSettings,
  logs: Array<{ fastType: string; fastEndMs: number; fastDurationMs: number }>,
): { completedStreak: number; missedStreak: number } {
  const anchorDates = getPastAnchorDates(6, settings.anchorDay);
  // Skip the most recent (it's "today" — we count from yesterday back)
  // Actually, getPastAnchorDates starts from today, so if today is the anchor,
  // the first entry is today. We should check from the most recent that is NOT today.
  let completedStreak = 0;
  let missedStreak = 0;

  for (const d of anchorDates) {
    const todayISO = new Date().toISOString().slice(0, 10);
    if (d.toISOString().slice(0, 10) === todayISO) continue; // skip today

    if (wasResetCompleted(d, logs)) {
      if (missedStreak === 0) completedStreak++;
      else break;
    } else {
      if (completedStreak === 0) missedStreak++;
      else break;
    }
  }

  return { completedStreak, missedStreak };
}

/**
 * Format elapsed time as H:MM from milliseconds.
 */
export function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Get a human-readable label for a fast type on a specific day.
 */
export function getDayTypeLabel(
  date: Date,
  settings: FastingSettings,
  preRamp: PreRamp | null,
): { type: FastType; label: string; color: string } {
  const type = getDayType(date, settings, preRamp);
  const meta = FAST_TYPE_META[type];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[date.getDay()];

  if (type === "reset_24hr") {
    const hours = settings.resetVariant === "extended_36hr" ? "36h" : "24h";
    return { type, label: `${dayName} · Reset Day (${hours})`, color: meta.color };
  }
  if (type === "tre_16_8") {
    return { type, label: `${dayName} · 16:8 TRE`, color: meta.color };
  }
  if (type === "overnight_12_14") {
    return { type, label: `${dayName} · Overnight Fast (12–14h)`, color: meta.color };
  }
  if (type === "pre_14_10") {
    return { type, label: `${dayName} · Pre-Phase (14:10)`, color: meta.color };
  }
  if (type === "pre_12_12") {
    return { type, label: `${dayName} · Pre-Phase (12:12)`, color: meta.color };
  }
  return { type, label: `${dayName} · ${meta.label}`, color: meta.color };
}
