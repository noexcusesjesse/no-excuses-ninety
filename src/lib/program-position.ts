/**
 * Working clock for the live LoadLine path (America/Phoenix calendar dates).
 *
 * startDate = LoadLine 30 Day 1 (first cohort: 2026-09-01).
 * Phase DATE WINDOWS are the clock — labels only after Day 30.
 * Do not treat this as The Ninety, the 15-month Reset, Base Camp, or No Excuses Nomad.
 * Do not paste an unstamped 365-row day-by-day file as signed protocol.
 *
 * First-cohort windows:
 *   Boot Camp analog  2026-08-18 – 2026-08-31  (done; not remapped; not Basic Training)
 *   LoadLine 30       days 1–30    2026-09-01 – 2026-09-30
 *   LoadLine 60       days 31–60   2026-10-01 – 2026-10-30
 *   LoadLine 90       days 61–90   2026-10-31 – 2026-11-29
 *   LoadLine 180      days 91–180  2026-11-30 – 2027-02-27
 *   LoadLine 365      days 181–365 2027-02-28 – 2027-08-31
 *   NOMAD             from 2027-09-01 (destination label only; never before Day 365)
 *
 * 24h / 36h are out of protocol on this path.
 */

export type ProgramBlock =
  | "before"
  | "bootCamp"
  | "loadLine30"
  | "loadLine60"
  | "loadLine90"
  | "loadLine180"
  | "loadLine365"
  | "nomad";

/** @deprecated Ninety phases are not the live path. Always null. */
export type NinetyPhase = "Foundation" | "Build" | "Identity";
export type WorkoutLetter = "A" | "B" | "REST";
export type HomeEnvironment = "foundation" | "strength" | "condition" | "recovery";

export const BOOT_CAMP_DAYS = 14;
export const LOADLINE_30_DAYS = 30;
export const LOADLINE_365_DAYS = 365;
export const PROTOCOL_MONTH_DAYS = 30;
export const FIRST_COHORT_DAY_ONE = "2026-09-01";

/** Aliases so existing callers keep compiling. Boot Camp is 14 days before Day 1. */
export const BASIC_TRAINING_DAYS = BOOT_CAMP_DAYS;
export const NINETY_DAYS = 90;
export const TOTAL_MONTHS = 15;
export const FIRST_24H_MONTH = 7;
export const FIRST_36H_MONTH = 8;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Signed LoadLine 30 week shape — weekday repeating, not a 365-row calendar. */
export const HOME_ENVIRONMENTS: Record<HomeEnvironment, { label: string; hint: string }> = {
  foundation: {
    label: "Foundation",
    hint: "Warm-up, mobility, bands, bodyweight, balance, core",
  },
  strength: {
    label: "Strength",
    hint: "Bands + bodyweight",
  },
  condition: {
    label: "Condition",
    hint: "Walking time + steps",
  },
  recovery: {
    label: "Recovery",
    hint: "Stretch, breathing, easy walk",
  },
};

export const LOADLINE_FORMULA = "TRAIN → MOVE → RECOVER → TRACK → REPEAT";
export const MEAL_WINDOW_LABEL = "14:10";
export const LAST_MEAL_WINDOW = "about 7:30–8:00 PM";
export const SAFETY_LINE =
  "If something feels off: stop / contact physician / follow what he already told you. Not medical advice. LoadLine does not prescribe, dose, or adjust medications.";

export interface WeekShapeDay {
  dayLabel: (typeof DAY_LABELS)[number];
  environment: HomeEnvironment;
  walkMinutes: number;
  walkNote: string;
  extra: string;
  stretchMinutes: number;
  isWeighIn: boolean;
}

export const LOADLINE_30_WEEK: WeekShapeDay[] = [
  { dayLabel: "Mon", environment: "strength", walkMinutes: 30, walkNote: "Walk 30 min", extra: "10 min stretch", stretchMinutes: 10, isWeighIn: false },
  { dayLabel: "Tue", environment: "foundation", walkMinutes: 30, walkNote: "Walk 30 min", extra: "Foundation or walk only", stretchMinutes: 0, isWeighIn: false },
  { dayLabel: "Wed", environment: "strength", walkMinutes: 30, walkNote: "Walk 30 min", extra: "Stretch", stretchMinutes: 10, isWeighIn: false },
  { dayLabel: "Thu", environment: "condition", walkMinutes: 30, walkNote: "Walk 30 min", extra: "Walk", stretchMinutes: 0, isWeighIn: false },
  { dayLabel: "Fri", environment: "strength", walkMinutes: 30, walkNote: "Walk 30 min", extra: "Stretch", stretchMinutes: 10, isWeighIn: false },
  { dayLabel: "Sat", environment: "condition", walkMinutes: 60, walkNote: "Longer walk up to 60 min", extra: "", stretchMinutes: 0, isWeighIn: false },
  { dayLabel: "Sun", environment: "recovery", walkMinutes: 25, walkNote: "Easy 20–30 min", extra: "Weigh-in (weight/waist)", stretchMinutes: 0, isWeighIn: true },
];

interface PhaseWindow {
  block: Exclude<ProgramBlock, "before" | "bootCamp" | "nomad">;
  firstDay: number;
  lastDay: number;
}

/** Day-number windows from startDate. First-cohort ISO dates are comments only. */
const PHASE_WINDOWS: PhaseWindow[] = [
  { block: "loadLine30", firstDay: 1, lastDay: 30 }, // 2026-09-01 – 2026-09-30
  { block: "loadLine60", firstDay: 31, lastDay: 60 }, // 2026-10-01 – 2026-10-30
  { block: "loadLine90", firstDay: 61, lastDay: 90 }, // 2026-10-31 – 2026-11-29
  { block: "loadLine180", firstDay: 91, lastDay: 180 }, // 2026-11-30 – 2027-02-27
  { block: "loadLine365", firstDay: 181, lastDay: 365 }, // 2027-02-28 – 2027-08-31
];

export interface ProgramPosition {
  asOf: string;
  startDate: string;
  bootCampStartDate: string;
  loadLine30EndDate: string;
  loadLine365EndDate: string;
  /** Alias of bootCampStartDate — Boot Camp analog, not Basic Training. */
  basicTrainingStartDate: string;
  /** Day 90 calendar date (LoadLine 90 end). Not The Ninety. */
  ninetyEndDate: string;
  /** Day 365 calendar date. Not a 15-month Reset end. */
  programEndDate: string;
  block: ProgramBlock;
  /** Unused 15-month clock. Always null on the live path. */
  programMonth: number | null;
  /** Day inside a 30-day phase (LL30/60/90); null for longer windows so we do not imply a 365-day UI. */
  dayInMonth: number | null;
  dayInBlock: number;
  daysInBlock: number;
  /**
   * 1-indexed day from startDate. Negative or zero before Day 1.
   * Used for phase windows only — not a 365-row protocol index.
   */
  programDay: number;
  ninetyPhase: NinetyPhase | null;
  ninetyWeek: number | null;
  isDeload: boolean;
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
  environment: HomeEnvironment;
  stretchMinutes: number;
  isWeighIn: boolean;
  isDay1Calibration: boolean;
  walkNote: string;
  extra: string;
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

export function lastDayOfProtocolCalendarMonth(startDate: string, monthNumber: number): string {
  const [y, m] = startDate.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1 + (monthNumber - 1) + 1, 0));
  return formatISODate(end);
}

export function bootCampStartDate(startDate: string): string {
  return addDays(startDate, -BOOT_CAMP_DAYS);
}

/** @deprecated Use bootCampStartDate. Same instant: 14 days before LoadLine 30 Day 1. */
export function basicTrainingStartDate(startDate: string): string {
  return bootCampStartDate(startDate);
}

export function loadLine30EndDate(startDate: string): string {
  return addDays(startDate, LOADLINE_30_DAYS - 1);
}

export function ninetyEndDate(startDate: string): string {
  return addDays(startDate, NINETY_DAYS - 1);
}

export function programEndDate(startDate: string): string {
  return addDays(startDate, LOADLINE_365_DAYS - 1);
}

function phaseForProgramDay(programDay: number): PhaseWindow | null {
  return PHASE_WINDOWS.find((p) => programDay >= p.firstDay && programDay <= p.lastDay) ?? null;
}

function emptyGates() {
  return {
    ninetyPhase: null as NinetyPhase | null,
    ninetyWeek: null as number | null,
    isDeload: false,
    extendedFast24hEligibleByMonth: false,
    extendedFast36hEligibleByMonth: false,
    programMonth: null as number | null,
  };
}

export function isOvernightOnlyBlock(block: ProgramBlock): boolean {
  void block;
  return true;
}

export function getProgramPosition(startDate: string, asOf: string): ProgramPosition {
  const btStart = bootCampStartDate(startDate);
  const ll30End = loadLine30EndDate(startDate);
  const ll90End = ninetyEndDate(startDate);
  const ll365End = programEndDate(startDate);
  const programDay = diffDays(startDate, asOf) + 1;

  const base = {
    asOf,
    startDate,
    bootCampStartDate: btStart,
    loadLine30EndDate: ll30End,
    loadLine365EndDate: ll365End,
    basicTrainingStartDate: btStart,
    ninetyEndDate: ll90End,
    programEndDate: ll365End,
  };

  if (asOf < btStart) {
    return {
      ...base,
      block: "before",
      dayInMonth: null,
      dayInBlock: 0,
      daysInBlock: 0,
      programDay,
      ...emptyGates(),
    };
  }

  if (asOf < startDate) {
    const dayInBlock = diffDays(btStart, asOf) + 1;
    return {
      ...base,
      block: "bootCamp",
      dayInMonth: null,
      dayInBlock,
      daysInBlock: BOOT_CAMP_DAYS,
      programDay,
      ...emptyGates(),
    };
  }

  if (programDay > LOADLINE_365_DAYS) {
    return {
      ...base,
      block: "nomad",
      dayInMonth: null,
      dayInBlock: programDay - LOADLINE_365_DAYS,
      daysInBlock: 0,
      programDay,
      ...emptyGates(),
    };
  }

  const phase = phaseForProgramDay(programDay);
  if (!phase) {
    return {
      ...base,
      block: "before",
      dayInMonth: null,
      dayInBlock: 0,
      daysInBlock: 0,
      programDay,
      ...emptyGates(),
    };
  }

  const daysInBlock = phase.lastDay - phase.firstDay + 1;
  const dayInBlock = programDay - phase.firstDay + 1;
  const dayInMonth = daysInBlock === PROTOCOL_MONTH_DAYS ? dayInBlock : null;

  return {
    ...base,
    block: phase.block,
    dayInMonth,
    dayInBlock,
    daysInBlock,
    programDay,
    ...emptyGates(),
  };
}

function weekShapeForDow(dow: number): WeekShapeDay {
  if (dow === 0) return LOADLINE_30_WEEK[6];
  return LOADLINE_30_WEEK[dow - 1];
}

/**
 * Signed LoadLine 30 week shape by weekday.
 * Day 1 (Tue Sep 1 first cohort): band calibration + Foundation + walk — not Strength.
 * No Ninety deloads. Saturday is a longer walk, not a fasted-walk protocol.
 */
export function getDayPlan(position: ProgramPosition): DayPlan {
  const iso = position.asOf;
  const dow = utcDayOfWeek(iso);
  const shape = weekShapeForDow(dow);
  const isDay1Calibration = position.programDay === 1;
  const environment: HomeEnvironment = isDay1Calibration ? "foundation" : shape.environment;
  let workout: WorkoutLetter = "REST";
  if (environment === "strength") workout = "A";

  return {
    date: iso,
    dayLabel: DAY_LABELS[dow],
    workout,
    walkMinutes: shape.walkMinutes,
    isFastedWalk: false,
    isDeload: false,
    environment,
    stretchMinutes: isDay1Calibration ? 0 : shape.stretchMinutes,
    isWeighIn: shape.isWeighIn,
    isDay1Calibration,
    walkNote: shape.walkNote,
    extra: isDay1Calibration
      ? "Band calibration, then Foundation + walk. Not a hero Strength session."
      : shape.extra,
  };
}

export function blockLabel(block: ProgramBlock): string {
  switch (block) {
    case "before":
      return "Not yet started";
    case "bootCamp":
      return "Boot Camp";
    case "loadLine30":
      return "LoadLine 30";
    case "loadLine60":
      return "LoadLine 60";
    case "loadLine90":
      return "LoadLine 90";
    case "loadLine180":
      return "LoadLine 180";
    case "loadLine365":
      return "LoadLine 365";
    case "nomad":
      return "NOMAD";
  }
}

export function isBeforeDay1(block: ProgramBlock): boolean {
  return block === "before" || block === "bootCamp";
}

export type Day90InterviewStatus = "not_yet" | "upcoming" | "due";

/** The Ninety is not the live path. No Day 90 interview clock. */
export function day90InterviewStatus(
  position: ProgramPosition,
  upcomingWindowDays = 7,
): Day90InterviewStatus {
  void position;
  void upcomingWindowDays;
  return "not_yet";
}

export function formatMonthLabel(position: ProgramPosition): string {
  if (position.block === "bootCamp") {
    return `Boot Camp ${position.dayInBlock}/${position.daysInBlock}`;
  }
  if (position.block === "loadLine30") {
    return `Day ${position.dayInBlock} of ${LOADLINE_30_DAYS}`;
  }
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

export function formatPositionKicker(position: ProgramPosition, dayLabel: string): string {
  const block = blockLabel(position.block);
  if (position.block === "bootCamp") {
    return `${dayLabel} · ${block} · Day ${position.dayInBlock} of ${position.daysInBlock}`;
  }
  if (position.block === "loadLine30") {
    return `${dayLabel} · ${block} · Day ${position.dayInBlock} of ${LOADLINE_30_DAYS}`;
  }
  if (position.block === "before") {
    return `${dayLabel} · Boot Camp starts ${formatDateShort(position.bootCampStartDate)}`;
  }
  return `${dayLabel} · ${block}`;
}

export function formatPositionSecondary(position: ProgramPosition): string | null {
  if (position.block === "bootCamp" || position.block === "before") {
    return `LoadLine 30 starts ${formatDateShort(position.startDate)}`;
  }
  if (position.block === "loadLine30") {
    return `Day ${position.programDay} of ${LOADLINE_30_DAYS}`;
  }
  if (position.block === "nomad") {
    return null;
  }
  const phase = PHASE_WINDOWS.find((p) => p.block === position.block);
  if (!phase) return null;
  const start = addDays(position.startDate, phase.firstDay - 1);
  const end = addDays(position.startDate, phase.lastDay - 1);
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

export function monthLabel(position: ProgramPosition): string {
  if (position.block === "before" || position.block === "bootCamp") return "Pre-Day 1";
  return blockLabel(position.block);
}

export function formatDayInBlock(position: ProgramPosition): string {
  if (position.block === "before") return "Not started";
  if (position.block === "nomad") return "NOMAD";
  if (position.block === "loadLine30") {
    return `Day ${position.dayInBlock} of ${position.daysInBlock}`;
  }
  if (position.block === "bootCamp") {
    return `Day ${position.dayInBlock} of ${position.daysInBlock}`;
  }
  return blockLabel(position.block);
}

export function formatCoachWhere(position: ProgramPosition): string {
  const block = blockLabel(position.block);
  if (position.block === "bootCamp") {
    return `${block} · Pre-Day 1 · ${formatDayInBlock(position)}`;
  }
  if (position.block === "loadLine30") {
    return `${block} · ${formatDayInBlock(position)}`;
  }
  return block;
}

export function isMissingLog(lastCheckIn: string | null, asOf: string): boolean {
  if (!lastCheckIn) return true;
  return diffDays(lastCheckIn, asOf) > 1;
}

export interface ExtendedFastProtocol {
  overnightOnly: boolean;
  month24hEligible: boolean;
  month36hEligible: boolean;
  inProtocol24h: boolean;
  inProtocol36h: boolean;
  label: string;
  shortLabel: string;
}

export function extendedFastProtocol(position: ProgramPosition): ExtendedFastProtocol {
  const name = blockLabel(position.block);
  return {
    overnightOnly: true,
    month24hEligible: false,
    month36hEligible: false,
    inProtocol24h: false,
    inProtocol36h: false,
    label: `Meal window 14:10 · 24h/36h not in protocol (${name})`,
    shortLabel: "14:10 meal window",
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
  if (position.block === "before") return { percent: 0, label: "LOADLINE" };
  if (position.block === "bootCamp") {
    return {
      percent: Math.round(((position.dayInBlock - 1) / BOOT_CAMP_DAYS) * 100),
      label: "BOOT CAMP",
    };
  }
  if (position.block === "loadLine30") {
    return {
      percent: Math.round(((position.dayInBlock - 1) / LOADLINE_30_DAYS) * 100),
      label: "LL30",
    };
  }
  if (position.block === "nomad") return { percent: 100, label: "NOMAD" };
  return { percent: 0, label: blockLabel(position.block).replace("LoadLine ", "LL") };
}

export function mealThemeDayIndex(position: ProgramPosition): number {
  if (position.block === "bootCamp") return Math.max(0, position.dayInBlock - 1);
  if (position.dayInMonth != null) return position.dayInMonth - 1;
  if (position.block === "loadLine30") return Math.max(0, position.dayInBlock - 1);
  return Math.max(0, (position.programDay - 1) % PROTOCOL_MONTH_DAYS);
}

export function currentMonthWindow(position: ProgramPosition): { start: string; end: string; day: number; of: number } {
  if (position.block === "bootCamp" || position.block === "before") {
    return {
      start: position.bootCampStartDate,
      end: addDays(position.startDate, -1),
      day: Math.max(1, position.dayInBlock),
      of: BOOT_CAMP_DAYS,
    };
  }
  if (position.block === "nomad") {
    return {
      start: addDays(position.startDate, LOADLINE_365_DAYS),
      end: addDays(position.startDate, LOADLINE_365_DAYS),
      day: 1,
      of: 1,
    };
  }
  const phase = PHASE_WINDOWS.find((p) => p.block === position.block);
  if (!phase) {
    return {
      start: position.startDate,
      end: position.loadLine30EndDate,
      day: 1,
      of: LOADLINE_30_DAYS,
    };
  }
  return {
    start: addDays(position.startDate, phase.firstDay - 1),
    end: addDays(position.startDate, phase.lastDay - 1),
    day: position.dayInBlock,
    of: position.daysInBlock,
  };
}
