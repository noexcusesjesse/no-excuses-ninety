/**
 * Single source of truth for where a client is in the 15-month No Excuses Reset.
 *
 * startDate = Day 1 of The Ninety.
 * Basic Training is the 14 calendar days immediately before startDate.
 * Protocol months are 30-day cycles from Day 1 (Month 1 = days 1–30).
 *
 * Blocks:
 *   Basic Training — 14-day runway. Habit loop only. No extended fasts.
 *   The Ninety     — months 1–3 (days 1–90). Foundation / Build / Identity.
 *                    Deloads weeks 4, 8, 12. No 24h or 36h fasts.
 *   The Build      — months 4–14 (days 91–420).
 *   Mastery        — month 15 through the last calendar day of the 15th month
 *                    (first cohort: Nov 30, 2027).
 *
 * Extended fasting month gates (still require physicianClearedExtendedFasts):
 *   24h — Month 7 onward
 *   36h — Month 8 onward
 * Neither appears in Basic Training or The Ninety, even if cleared.
 */

export type ProgramBlock =
  | "before"
  | "basicTraining"
  | "ninety"
  | "build"
  | "mastery"
  | "complete";

export type NinetyPhase = "Foundation" | "Build" | "Identity";
export type WorkoutLetter = "A" | "B" | "REST";

export const BASIC_TRAINING_DAYS = 14;
export const NINETY_DAYS = 90;
export const PROTOCOL_MONTH_DAYS = 30;
export const TOTAL_MONTHS = 15;
export const FIRST_24H_MONTH = 7;
export const FIRST_36H_MONTH = 8;
export const FIRST_COHORT_DAY_ONE = "2026-09-01";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface ProgramPosition {
  asOf: string;
  startDate: string;
  basicTrainingStartDate: string;
  ninetyEndDate: string;
  programEndDate: string;
  block: ProgramBlock;
  /** 1–15 once Day 1 has begun; null during Basic Training / before. */
  programMonth: number | null;
  /** 1–30 inside a protocol month (month 15 may run longer than 30). */
  dayInMonth: number | null;
  dayInBlock: number;
  daysInBlock: number;
  /**
   * 1-indexed day from startDate. Negative or zero before Day 1.
   * Not clamped to 90.
   */
  programDay: number;
  ninetyPhase: NinetyPhase | null;
  /** Protocol week 1–13 during The Ninety. */
  ninetyWeek: number | null;
  isDeload: boolean;
  /** Month gate only — physician clearance is applied in fasting logic. */
  extendedFast24hEligibleByMonth: boolean;
  extendedFast36hEligibleByMonth: boolean;
}

export interface DayPlan {
  date: string;
  dayLabel: string;
  workout: WorkoutLetter;
  walkMinutes: number;
  isFastedWalk: boolean;
  isDeload: boolean;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayISODate(): string {
  return formatISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatISODate(d);
}

export function diffDays(fromISO: string, toISO: string): number {
  const from = parseISODate(fromISO);
  const to = parseISODate(toISO);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function utcDayOfWeek(iso: string): number {
  return parseISODate(iso).getUTCDay();
}

/**
 * Last calendar day of the Nth protocol month, where month 1 is startDate's month.
 * First cohort (Day 1 = 2026-09-01, N = 15) → 2027-11-30.
 */
export function lastDayOfProtocolCalendarMonth(startDate: string, monthNumber: number): string {
  const [y, m] = startDate.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1 + (monthNumber - 1) + 1, 0));
  return formatISODate(end);
}

export function basicTrainingStartDate(startDate: string): string {
  return addDays(startDate, -BASIC_TRAINING_DAYS);
}

export function ninetyEndDate(startDate: string): string {
  return addDays(startDate, NINETY_DAYS - 1);
}

export function programEndDate(startDate: string): string {
  return lastDayOfProtocolCalendarMonth(startDate, TOTAL_MONTHS);
}

function ninetyPhaseForDay(programDay: number): NinetyPhase {
  if (programDay <= 30) return "Foundation";
  if (programDay <= 60) return "Build";
  return "Identity";
}

export function isOvernightOnlyBlock(block: ProgramBlock): boolean {
  return block === "basicTraining" || block === "ninety";
}

export function getProgramPosition(startDate: string, asOf: string): ProgramPosition {
  const btStart = basicTrainingStartDate(startDate);
  const ninetyEnd = ninetyEndDate(startDate);
  const end = programEndDate(startDate);
  const programDay = diffDays(startDate, asOf) + 1;

  const base = {
    asOf,
    startDate,
    basicTrainingStartDate: btStart,
    ninetyEndDate: ninetyEnd,
    programEndDate: end,
  };

  if (asOf < btStart) {
    return {
      ...base,
      block: "before",
      programMonth: null,
      dayInMonth: null,
      dayInBlock: 0,
      daysInBlock: 0,
      programDay,
      ninetyPhase: null,
      ninetyWeek: null,
      isDeload: false,
      extendedFast24hEligibleByMonth: false,
      extendedFast36hEligibleByMonth: false,
    };
  }

  if (asOf > end) {
    const totalDays = diffDays(startDate, end) + 1;
    return {
      ...base,
      block: "complete",
      programMonth: TOTAL_MONTHS,
      dayInMonth: PROTOCOL_MONTH_DAYS,
      dayInBlock: totalDays,
      daysInBlock: totalDays,
      programDay,
      ninetyPhase: null,
      ninetyWeek: null,
      isDeload: false,
      extendedFast24hEligibleByMonth: false,
      extendedFast36hEligibleByMonth: false,
    };
  }

  if (asOf < startDate) {
    const dayInBlock = diffDays(btStart, asOf) + 1;
    return {
      ...base,
      block: "basicTraining",
      programMonth: null,
      dayInMonth: null,
      dayInBlock,
      daysInBlock: BASIC_TRAINING_DAYS,
      programDay,
      ninetyPhase: null,
      ninetyWeek: null,
      isDeload: false,
      extendedFast24hEligibleByMonth: false,
      extendedFast36hEligibleByMonth: false,
    };
  }

  if (programDay <= NINETY_DAYS) {
    const programMonth = Math.ceil(programDay / PROTOCOL_MONTH_DAYS);
    const ninetyWeek = Math.ceil(programDay / 7);
    return {
      ...base,
      block: "ninety",
      programMonth,
      dayInMonth: ((programDay - 1) % PROTOCOL_MONTH_DAYS) + 1,
      dayInBlock: programDay,
      daysInBlock: NINETY_DAYS,
      programDay,
      ninetyPhase: ninetyPhaseForDay(programDay),
      ninetyWeek,
      isDeload: ninetyWeek === 4 || ninetyWeek === 8 || ninetyWeek === 12,
      extendedFast24hEligibleByMonth: false,
      extendedFast36hEligibleByMonth: false,
    };
  }

  const month15Start = addDays(startDate, 14 * PROTOCOL_MONTH_DAYS); // Day 421
  if (asOf < month15Start) {
    const programMonth = Math.ceil(programDay / PROTOCOL_MONTH_DAYS);
    return {
      ...base,
      block: "build",
      programMonth,
      dayInMonth: ((programDay - 1) % PROTOCOL_MONTH_DAYS) + 1,
      dayInBlock: programDay - NINETY_DAYS,
      daysInBlock: 14 * PROTOCOL_MONTH_DAYS - NINETY_DAYS,
      programDay,
      ninetyPhase: null,
      ninetyWeek: null,
      isDeload: false,
      extendedFast24hEligibleByMonth: programMonth >= FIRST_24H_MONTH,
      extendedFast36hEligibleByMonth: programMonth >= FIRST_36H_MONTH,
    };
  }

  const dayInBlock = diffDays(month15Start, asOf) + 1;
  const daysInBlock = diffDays(month15Start, end) + 1;
  const dayInMonth =
    programDay > 14 * PROTOCOL_MONTH_DAYS
      ? Math.min(PROTOCOL_MONTH_DAYS, ((Math.min(programDay, 15 * PROTOCOL_MONTH_DAYS) - 1) % PROTOCOL_MONTH_DAYS) + 1)
      : ((programDay - 1) % PROTOCOL_MONTH_DAYS) + 1;

  return {
    ...base,
    block: "mastery",
    programMonth: TOTAL_MONTHS,
    dayInMonth,
    dayInBlock,
    daysInBlock,
    programDay,
    ninetyPhase: null,
    ninetyWeek: null,
    isDeload: false,
    extendedFast24hEligibleByMonth: true,
    extendedFast36hEligibleByMonth: true,
  };
}

/**
 * Calendar-weekday plan. Saturday = 60-min fasted walk.
 * Mon/Wed/Fri = Workout A/B alternating by protocol week from Day 1.
 * Deload is protocol-week based (The Ninety weeks 4, 8, 12 only).
 */
export function getDayPlan(position: ProgramPosition): DayPlan {
  const iso = position.asOf;
  const dow = utcDayOfWeek(iso);
  const protocolWeek = position.programDay >= 1 ? Math.ceil(position.programDay / 7) : 1;
  let workout: WorkoutLetter = "REST";
  if (dow === 1 || dow === 3 || dow === 5) {
    workout = protocolWeek % 2 === 1 ? "A" : "B";
  }
  return {
    date: iso,
    dayLabel: DAY_LABELS[dow],
    workout,
    walkMinutes: dow === 6 ? 60 : dow === 0 ? 25 : 30,
    isFastedWalk: dow === 6,
    isDeload: position.isDeload,
  };
}

export function blockLabel(block: ProgramBlock): string {
  switch (block) {
    case "before":
      return "Not yet started";
    case "basicTraining":
      return "Basic Training";
    case "ninety":
      return "The Ninety";
    case "build":
      return "The Build";
    case "mastery":
      return "Mastery";
    case "complete":
      return "Reset complete";
  }
}

export function isBeforeDay1(block: ProgramBlock): boolean {
  return block === "before" || block === "basicTraining";
}

export type Day90InterviewStatus = "not_yet" | "upcoming" | "due";

/**
 * The Ninety ends on ninetyEndDate (first cohort: Nov 29 2026).
 * Exit interview is due that day and after. Upcoming = last 7 days of The Ninety.
 */
export function day90InterviewStatus(
  position: ProgramPosition,
  upcomingWindowDays = 7,
): Day90InterviewStatus {
  if (position.asOf >= position.ninetyEndDate) return "due";
  const daysLeft = diffDays(position.asOf, position.ninetyEndDate);
  if (daysLeft <= upcomingWindowDays) return "upcoming";
  return "not_yet";
}

export function formatMonthLabel(position: ProgramPosition): string {
  if (position.block === "basicTraining") {
    return `Runway ${position.dayInBlock}/${position.daysInBlock}`;
  }
  if (position.programMonth) return `Month ${position.programMonth} of ${TOTAL_MONTHS}`;
  return blockLabel(position.block);
}

export function formatDateShort(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Eyebrow / kicker on Client pages. Never "Day N of 90" as the only identity. */
export function formatPositionKicker(position: ProgramPosition, dayLabel: string): string {
  const block = blockLabel(position.block);
  if (position.block === "basicTraining") {
    return `${dayLabel} · ${block} · Runway day ${position.dayInBlock} of ${position.daysInBlock}`;
  }
  if (position.block === "ninety") {
    return `${dayLabel} · ${block} · Month ${position.programMonth} ${position.ninetyPhase}`;
  }
  if (position.block === "build" || position.block === "mastery") {
    return `${dayLabel} · ${block} · Month ${position.programMonth} of ${TOTAL_MONTHS}`;
  }
  if (position.block === "before") {
    return `${dayLabel} · Basic Training starts ${formatDateShort(position.basicTrainingStartDate)}`;
  }
  return `${dayLabel} · ${block}`;
}

export function formatPositionSecondary(position: ProgramPosition): string | null {
  if (position.block === "basicTraining" || position.block === "before") {
    return `The Ninety starts ${formatDateShort(position.startDate)}`;
  }
  if (position.block === "ninety") {
    return `Day ${position.programDay} of ${NINETY_DAYS}`;
  }
  if (position.block === "build") {
    return `Day ${position.dayInMonth} of 30 · Month ${position.programMonth} of ${TOTAL_MONTHS}`;
  }
  if (position.block === "mastery") {
    return `Program ends ${formatDateShort(position.programEndDate)}`;
  }
  return null;
}

/** Month 1–15 after Day 1; Pre-Day 1 during Basic Training / before. */
export function monthLabel(position: ProgramPosition): string {
  if (position.programMonth == null) return "Pre-Day 1";
  return `Month ${position.programMonth}`;
}

export function formatDayInBlock(position: ProgramPosition): string {
  if (position.block === "before") return "Not started";
  if (position.block === "complete") return "Complete";
  return `Day ${position.dayInBlock} of ${position.daysInBlock}`;
}

/**
 * Coach roster / file identity. Block + month + day-in-block.
 * Never "Day N of 90" as the only identity.
 */
export function formatCoachWhere(position: ProgramPosition): string {
  const block = blockLabel(position.block);
  const month = monthLabel(position);
  if (position.block === "basicTraining") {
    return `${block} · ${month} · ${formatDayInBlock(position)}`;
  }
  if (position.block === "ninety") {
    return `${block} · ${month} ${position.ninetyPhase} · ${formatDayInBlock(position)}`;
  }
  if (position.block === "build" || position.block === "mastery") {
    return `${block} · ${month} of ${TOTAL_MONTHS} · ${formatDayInBlock(position)}`;
  }
  if (position.block === "before") {
    return `${block} · ${month}`;
  }
  return block;
}

/** No check-in, or last check-in is more than one calendar day before asOf. */
export function isMissingLog(lastCheckIn: string | null, asOf: string): boolean {
  if (!lastCheckIn) return true;
  return diffDays(lastCheckIn, asOf) > 1;
}

export interface ExtendedFastProtocol {
  overnightOnly: boolean;
  month24hEligible: boolean;
  month36hEligible: boolean;
  /** Month gate only — physician clearance is a separate flag. */
  inProtocol24h: boolean;
  inProtocol36h: boolean;
  label: string;
  shortLabel: string;
}

/**
 * Whether 24h/36h are even in-protocol for this block/month.
 * Does not consult physicianClearedExtendedFasts.
 */
export function extendedFastProtocol(position: ProgramPosition): ExtendedFastProtocol {
  const overnightOnly =
    isOvernightOnlyBlock(position.block) ||
    position.block === "before" ||
    position.block === "complete";
  const month24hEligible = position.extendedFast24hEligibleByMonth;
  const month36hEligible = position.extendedFast36hEligibleByMonth;
  const inProtocol24h = month24hEligible && !overnightOnly;
  const inProtocol36h = month36hEligible && !overnightOnly;

  let label: string;
  let shortLabel: string;
  if (position.block === "basicTraining") {
    label = "Overnight only · 24h/36h not in protocol (Basic Training)";
    shortLabel = "Overnight only";
  } else if (position.block === "ninety") {
    label = "Overnight only · 24h/36h not in protocol (The Ninety)";
    shortLabel = "Overnight only";
  } else if (position.block === "before" || position.block === "complete") {
    label = "Overnight only · 24h/36h not in protocol";
    shortLabel = "Overnight only";
  } else if (inProtocol36h) {
    label = "24h in protocol · 36h eligible (Month 8+, extended_36hr only)";
    shortLabel = "24h in protocol";
  } else if (inProtocol24h) {
    label = "24h in protocol (Month 7+) · 36h from Month 8";
    shortLabel = "24h in protocol";
  } else {
    label = "Overnight/TRE · 24h from Month 7, 36h from Month 8";
    shortLabel = "No 24h yet";
  }

  return {
    overnightOnly,
    month24hEligible,
    month36hEligible,
    inProtocol24h,
    inProtocol36h,
    label,
    shortLabel,
  };
}

export interface CoachProgramSnapshot {
  position: ProgramPosition;
  blockLabel: string;
  monthLabel: string;
  whereLine: string;
  secondary: string | null;
  daysSinceCheckIn: number | null;
  missingLog: boolean;
  physicianClearedExtendedFasts: boolean;
  overnightOnly: boolean;
  extendedFast24hInProtocol: boolean;
  extendedFast36hInProtocol: boolean;
  fastProtocolLabel: string;
  fastProtocolShort: string;
}

/**
 * Single snapshot for Coach roster + client file. Reuses getProgramPosition —
 * no second calendar, no 90-day clamp.
 */
export function coachProgramSnapshot(
  startDate: string,
  asOf: string,
  lastCheckIn: string | null,
  physicianClearedExtendedFasts: boolean,
): CoachProgramSnapshot {
  const position = getProgramPosition(startDate, asOf);
  const protocol = extendedFastProtocol(position);
  const daysSinceCheckIn = lastCheckIn ? diffDays(lastCheckIn, asOf) : null;
  return {
    position,
    blockLabel: blockLabel(position.block),
    monthLabel: monthLabel(position),
    whereLine: formatCoachWhere(position),
    secondary: formatPositionSecondary(position),
    daysSinceCheckIn,
    missingLog: isMissingLog(lastCheckIn, asOf),
    physicianClearedExtendedFasts,
    overnightOnly: protocol.overnightOnly,
    extendedFast24hInProtocol: protocol.inProtocol24h,
    extendedFast36hInProtocol: protocol.inProtocol36h,
    fastProtocolLabel: protocol.label,
    fastProtocolShort: protocol.shortLabel,
  };
}

export function journeyProgress(position: ProgramPosition): { percent: number; label: string } {
  if (position.block === "before") return { percent: 0, label: "RESET" };
  if (position.block === "basicTraining") {
    return {
      percent: Math.round(((position.dayInBlock - 1) / BASIC_TRAINING_DAYS) * 100),
      label: "RUNWAY",
    };
  }
  if (position.block === "complete") return { percent: 100, label: "RESET" };
  const monthsDone = (position.programMonth ?? 1) - 1;
  const monthFrac = ((position.dayInMonth ?? 1) - 1) / PROTOCOL_MONTH_DAYS;
  return {
    percent: Math.min(100, Math.round(((monthsDone + monthFrac) / TOTAL_MONTHS) * 100)),
    label: "RESET",
  };
}

/** Index into the 30-day meal-theme rotation. */
export function mealThemeDayIndex(position: ProgramPosition): number {
  if (position.block === "basicTraining") return Math.max(0, position.dayInBlock - 1);
  if (position.dayInMonth != null) return position.dayInMonth - 1;
  return 0;
}

export function currentMonthWindow(position: ProgramPosition): { start: string; end: string; day: number; of: number } {
  if (position.block === "basicTraining" || position.block === "before") {
    return {
      start: position.basicTrainingStartDate,
      end: addDays(position.startDate, -1),
      day: Math.max(1, position.dayInBlock),
      of: BASIC_TRAINING_DAYS,
    };
  }
  if (position.block === "complete") {
    return {
      start: position.startDate,
      end: position.programEndDate,
      day: 1,
      of: 1,
    };
  }
  const month = position.programMonth ?? 1;
  const start = addDays(position.startDate, (month - 1) * PROTOCOL_MONTH_DAYS);
  const protocolEnd = addDays(start, PROTOCOL_MONTH_DAYS - 1);
  const end = position.block === "mastery"
    ? position.programEndDate
    : protocolEnd;
  return {
    start,
    end,
    day: position.dayInMonth ?? 1,
    of: PROTOCOL_MONTH_DAYS,
  };
}
