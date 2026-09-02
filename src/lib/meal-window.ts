/**
 * LoadLine 30 meal window — TRE 14:10 only.
 *
 * Port of the local single-page fasting-tracker UX (wake + bedtime →
 * eating window + three slots). Protocol is locked: 14 hours not eating,
 * 10 hour eating window. No 12:12 / 16:8 / 18:6 picker. No 24h / 36h.
 *
 * Math (demo, refined when the 10h window would miss the day):
 *   1. Close prefers 3 hours before bedtime.
 *   2. Close never sits closer than 2 hours to bedtime.
 *   3. Open = close − 10 hours.
 *   4. If open is before wake, shift the whole 10h window forward so it
 *      still fits between wake and (bedtime − 2h). If that span is shorter
 *      than 10h, use the available span — do not invent a second protocol.
 *
 * Three meals inside the window, ≥ ~3 hours apart when the span allows:
 *   Break fast near open, Meal A at the midpoint, Meal B at close.
 */

export const TRE_PROTOCOL = "14:10" as const;
export const EATING_HOURS = 10;
export const FAST_HOURS = 14;
export const PREFERRED_BED_BUFFER_MIN = 3 * 60;
export const MIN_BED_BUFFER_MIN = 2 * 60;
export const MIN_MEAL_GAP_MIN = 3 * 60;
export const MINUTES_PER_DAY = 24 * 60;

/** Defaults land last meal at 7:30 PM — packet "about 7:30–8:00 PM". */
export const DEFAULT_WAKE = "06:30";
export const DEFAULT_BED = "22:30";

export type MealSlotId = "breakFast" | "mealA" | "mealB";

export interface MealSlot {
  id: MealSlotId;
  label: string;
  minutes: number;
}

export interface EatingWindow {
  protocol: typeof TRE_PROTOCOL;
  eatingHours: typeof EATING_HOURS;
  fastHours: typeof FAST_HOURS;
  wakeMinutes: number;
  bedMinutes: number;
  /** Minutes from midnight; may exceed 1440 when bedtime is after midnight. */
  openMinutes: number;
  closeMinutes: number;
  eatingMinutes: number;
  fitsFullWindow: boolean;
  slots: MealSlot[];
}

export function parseClock(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatClock24(minutes: number): string {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function formatClock12(minutes: number): string {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours24 = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
}

/** Bedtime on or before wake is treated as the next calendar morning. */
export function normalizeBedMinutes(wakeMinutes: number, bedMinutes: number): number {
  return bedMinutes <= wakeMinutes ? bedMinutes + MINUTES_PER_DAY : bedMinutes;
}

export function placeMealSlots(openMinutes: number, closeMinutes: number): MealSlot[] {
  const span = closeMinutes - openMinutes;
  let mealA = Math.round((openMinutes + closeMinutes) / 2);
  if (span >= 2 * MIN_MEAL_GAP_MIN) {
    mealA = Math.max(openMinutes + MIN_MEAL_GAP_MIN, Math.min(closeMinutes - MIN_MEAL_GAP_MIN, mealA));
  }
  return [
    { id: "breakFast", label: "Break fast", minutes: openMinutes },
    { id: "mealA", label: "Meal A", minutes: mealA },
    { id: "mealB", label: "Meal B", minutes: closeMinutes },
  ];
}

export function computeEatingWindow(wakeHHMM: string, bedHHMM: string): EatingWindow | null {
  const wakeMinutes = parseClock(wakeHHMM);
  const bedClock = parseClock(bedHHMM);
  if (wakeMinutes == null || bedClock == null) return null;

  const bedMinutes = normalizeBedMinutes(wakeMinutes, bedClock);
  const latestClose = bedMinutes - MIN_BED_BUFFER_MIN;
  const preferredClose = bedMinutes - PREFERRED_BED_BUFFER_MIN;
  const fullWindow = EATING_HOURS * 60;

  let closeMinutes = preferredClose;
  let openMinutes = closeMinutes - fullWindow;

  if (openMinutes < wakeMinutes) {
    openMinutes = wakeMinutes;
    closeMinutes = openMinutes + fullWindow;
  }

  if (closeMinutes > latestClose) {
    closeMinutes = latestClose;
    openMinutes = closeMinutes - fullWindow;
    if (openMinutes < wakeMinutes) {
      openMinutes = wakeMinutes;
      closeMinutes = Math.min(wakeMinutes + fullWindow, latestClose);
    }
  }

  const eatingMinutes = Math.max(0, closeMinutes - openMinutes);

  return {
    protocol: TRE_PROTOCOL,
    eatingHours: EATING_HOURS,
    fastHours: FAST_HOURS,
    wakeMinutes,
    bedMinutes,
    openMinutes,
    closeMinutes,
    eatingMinutes,
    fitsFullWindow: eatingMinutes >= fullWindow,
    slots: placeMealSlots(openMinutes, closeMinutes),
  };
}

export function timelinePercents(window: EatingWindow): {
  openPct: number;
  closePct: number;
  widthPct: number;
  slotPcts: Record<MealSlotId, number>;
} {
  const span = Math.max(1, window.bedMinutes - window.wakeMinutes);
  const pct = (minutes: number) =>
    Math.min(100, Math.max(0, ((minutes - window.wakeMinutes) / span) * 100));
  const openPct = pct(window.openMinutes);
  const closePct = pct(window.closeMinutes);
  return {
    openPct,
    closePct,
    widthPct: Math.max(0, closePct - openPct),
    slotPcts: {
      breakFast: pct(window.slots[0].minutes),
      mealA: pct(window.slots[1].minutes),
      mealB: pct(window.slots[2].minutes),
    },
  };
}
