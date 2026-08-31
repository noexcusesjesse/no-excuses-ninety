/**
 * Program position + fasting gate checks. Run: npx tsx src/lib/program-position.test.ts
 *
 * Live clock is LoadLine phase DATE WINDOWS. No Ninety / 15-month Reset.
 * No 365-row day-by-day protocol in these assertions.
 */
import assert from "node:assert/strict";
import {
  FIRST_COHORT_DAY_ONE,
  LOADLINE_FORMULA,
  blockLabel,
  coachProgramSnapshot,
  day90InterviewStatus,
  extendedFastProtocol,
  formatCoachWhere,
  formatMonthLabel,
  formatPositionKicker,
  formatPositionSecondary,
  getDayPlan,
  getProgramPosition,
  isBeforeDay1,
  isMissingLog,
  isOvernightOnlyBlock,
  monthLabel,
  programEndDate,
} from "./program-position";
import {
  getDayType,
  getTargetHours,
  type FastingSettings,
} from "./fast-cycle";

const START = FIRST_COHORT_DAY_ONE;

const CLEARED_24: FastingSettings = {
  anchorDay: 1,
  treDays: [3, 5],
  resetVariant: "standard_24hr",
  physicianClearedExtendedFasts: true,
};

const CLEARED_36: FastingSettings = {
  ...CLEARED_24,
  resetVariant: "extended_36hr",
};

const NOT_CLEARED: FastingSettings = {
  ...CLEARED_24,
  physicianClearedExtendedFasts: false,
};

function typeOn(iso: string, settings: FastingSettings) {
  const position = getProgramPosition(START, iso);
  return getDayType(new Date(`${iso}T12:00:00Z`), settings, null, position);
}

function hoursOn(iso: string, settings: FastingSettings) {
  const position = getProgramPosition(START, iso);
  const type = getDayType(new Date(`${iso}T12:00:00Z`), settings, null, position);
  return getTargetHours(type, settings, position);
}

function assertNotNinetyCopy(value: string) {
  assert.ok(!/the ninety/i.test(value), `must not say The Ninety: ${value}`);
  assert.ok(!/basic training/i.test(value), `must not say Basic Training: ${value}`);
  assert.ok(!/base camp/i.test(value), `must not say Base Camp: ${value}`);
  assert.ok(!/no excuses nomad/i.test(value), `must not say No Excuses Nomad: ${value}`);
  assert.ok(!/of 15/.test(value), `must not use 15-month clock: ${value}`);
}

// --- Boot Camp analog (Aug 18–31 2026) ---
const aug27 = getProgramPosition(START, "2026-08-27");
assert.equal(aug27.block, "bootCamp");
assert.equal(aug27.dayInBlock, 10);
assert.equal(aug27.daysInBlock, 14);
assert.equal(aug27.programMonth, null);
assert.equal(aug27.ninetyPhase, null);
assert.equal(aug27.basicTrainingStartDate, "2026-08-18");
assert.equal(aug27.bootCampStartDate, "2026-08-18");
assert.equal(aug27.startDate, "2026-09-01");
assert.equal(isOvernightOnlyBlock(aug27.block), true);
assert.equal(formatPositionKicker(aug27, "Thu"), "Thu · Boot Camp · Day 10 of 14");
assert.equal(formatPositionSecondary(aug27), "LoadLine 30 starts Sep 1, 2026");
assert.ok(!formatPositionKicker(aug27, "Thu").includes("of 90"));
assertNotNinetyCopy(formatPositionKicker(aug27, "Thu"));
assertNotNinetyCopy(formatPositionSecondary(aug27) ?? "");

const aug18 = getProgramPosition(START, "2026-08-18");
assert.equal(aug18.block, "bootCamp");
assert.equal(aug18.dayInBlock, 1);

const aug31 = getProgramPosition(START, "2026-08-31");
assert.equal(aug31.block, "bootCamp");
assert.equal(aug31.dayInBlock, 14);
assert.equal(aug31.block === "loadLine30", false);
assert.notEqual(blockLabel(aug31.block), "The Ninety");
assert.equal(formatPositionKicker(aug31, "Mon"), "Mon · Boot Camp · Day 14 of 14");
assert.equal(formatPositionSecondary(aug31), "LoadLine 30 starts Sep 1, 2026");
assert.ok(!/ninety/i.test(formatPositionKicker(aug31, "Mon")));
assert.ok(!/basic training/i.test(formatPositionKicker(aug31, "Mon")));

// --- LoadLine 30 Day 1 (Tue Sep 1 2026) ---
const sep1 = getProgramPosition(START, "2026-09-01");
assert.equal(sep1.block, "loadLine30");
assert.equal(sep1.programDay, 1);
assert.equal(sep1.dayInBlock, 1);
assert.equal(sep1.daysInBlock, 30);
assert.equal(sep1.programMonth, null);
assert.equal(sep1.ninetyPhase, null);
assert.equal(sep1.isDeload, false);
assert.equal(formatPositionKicker(sep1, "Tue"), "Tue · LoadLine 30 · Day 1 of 30");
assert.equal(formatPositionSecondary(sep1), "Day 1 of 30");
assertNotNinetyCopy(formatPositionKicker(sep1, "Tue"));
assert.ok(!formatPositionKicker(sep1, "Tue").includes("Reset"));

const day1Plan = getDayPlan(sep1);
assert.equal(day1Plan.dayLabel, "Tue");
assert.equal(day1Plan.environment, "foundation");
assert.equal(day1Plan.workout, "REST");
assert.equal(day1Plan.isDay1Calibration, true);
assert.equal(day1Plan.isDeload, false);
assert.equal(day1Plan.isFastedWalk, false);
assert.match(day1Plan.extra, /Band calibration/i);
assert.match(day1Plan.extra, /Foundation/i);
assert.ok(!/hero Strength/i.test(day1Plan.extra) || /Not a hero Strength/.test(day1Plan.extra));

const sep30 = getProgramPosition(START, "2026-09-30");
assert.equal(sep30.block, "loadLine30");
assert.equal(sep30.programDay, 30);
assert.equal(sep30.dayInBlock, 30);
assert.equal(formatPositionKicker(sep30, "Wed"), "Wed · LoadLine 30 · Day 30 of 30");

// --- LoadLine 60 starts Oct 1 — not Ninety month 2 ---
const oct1 = getProgramPosition(START, "2026-10-01");
assert.equal(oct1.block, "loadLine60");
assert.equal(oct1.programDay, 31);
assert.equal(oct1.programMonth, null);
assert.equal(formatPositionKicker(oct1, "Thu"), "Thu · LoadLine 60");
assert.ok(!/ninety/i.test(formatPositionKicker(oct1, "Thu")));
assert.ok(!/month 2/i.test(formatPositionKicker(oct1, "Thu")));
assert.equal(formatPositionSecondary(oct1), "Oct 1, 2026 – Oct 30, 2026");

const oct30 = getProgramPosition(START, "2026-10-30");
assert.equal(oct30.block, "loadLine60");
assert.equal(oct30.programDay, 60);

// --- Later phase labels only (date windows, not 365-row copy) ---
const oct31 = getProgramPosition(START, "2026-10-31");
assert.equal(oct31.block, "loadLine90");
assert.equal(oct31.programDay, 61);
assert.equal(formatPositionKicker(oct31, "Sat"), "Sat · LoadLine 90");
assert.ok(!/the ninety/i.test(formatPositionKicker(oct31, "Sat")));

const nov29 = getProgramPosition(START, "2026-11-29");
assert.equal(nov29.block, "loadLine90");
assert.equal(nov29.programDay, 90);

const nov30 = getProgramPosition(START, "2026-11-30");
assert.equal(nov30.block, "loadLine180");
assert.equal(nov30.programDay, 91);
assert.equal(formatPositionKicker(nov30, "Mon"), "Mon · LoadLine 180");

const feb27 = getProgramPosition(START, "2027-02-27");
assert.equal(feb27.block, "loadLine180");
assert.equal(feb27.programDay, 180);

const feb28 = getProgramPosition(START, "2027-02-28");
assert.equal(feb28.block, "loadLine365");
assert.equal(feb28.programDay, 181);
assert.equal(formatPositionKicker(feb28, "Sun"), "Sun · LoadLine 365");
assert.ok(!/^NOMAD$/i.test(formatPositionKicker(feb28, "Sun")));
assert.ok(!formatPositionKicker(feb28, "Sun").includes("NOMAD"));

const aug31_27 = getProgramPosition(START, "2027-08-31");
assert.equal(aug31_27.block, "loadLine365");
assert.equal(aug31_27.programDay, 365);
assert.ok(!formatPositionKicker(aug31_27, "Tue").includes("NOMAD"));

assert.equal(programEndDate(START), "2027-08-31");

const nomadDay = getProgramPosition(START, "2027-09-01");
assert.equal(nomadDay.block, "nomad");
assert.equal(nomadDay.programDay, 366);
assert.equal(formatPositionKicker(nomadDay, "Wed"), "Wed · NOMAD");
assert.ok(!/no excuses nomad/i.test(formatPositionKicker(nomadDay, "Wed")));

// No Ninety deloads
assert.equal(getProgramPosition(START, "2026-09-22").isDeload, false);
assert.equal(getProgramPosition(START, "2026-09-21").isDeload, false);

const sat = getDayPlan(getProgramPosition(START, "2026-08-29"));
assert.equal(sat.dayLabel, "Sat");
assert.equal(sat.isFastedWalk, false);
assert.equal(sat.walkMinutes, 60);
assert.equal(sat.environment, "condition");

const mon = getDayPlan(getProgramPosition(START, "2026-09-07"));
assert.equal(mon.environment, "strength");
assert.equal(mon.walkMinutes, 30);
assert.equal(mon.stretchMinutes, 10);

assert.equal(LOADLINE_FORMULA, "TRAIN → MOVE → RECOVER → TRACK → REPEAT");

// --- Fasting gates: 14:10 meal window, never 24h/36h ---
assert.equal(typeOn("2026-08-24", CLEARED_24), "pre_14_10");
assert.equal(typeOn("2026-08-24", CLEARED_36), "pre_14_10");
assert.equal(typeOn("2026-08-27", CLEARED_24), "pre_14_10");
assert.equal(typeOn("2026-09-01", CLEARED_24), "pre_14_10");
assert.equal(typeOn("2026-09-01", CLEARED_36), "pre_14_10");
assert.equal(typeOn("2026-09-07", CLEARED_36), "pre_14_10");
assert.equal(hoursOn("2026-09-07", CLEARED_36), 14);
assert.equal(typeOn("2026-09-02", CLEARED_24), "pre_14_10");
assert.equal(typeOn("2026-10-01", CLEARED_24), "pre_14_10");
assert.equal(typeOn("2026-12-07", CLEARED_24), "pre_14_10");
assert.equal(typeOn("2027-03-01", CLEARED_24), "pre_14_10");
assert.equal(hoursOn("2027-03-01", CLEARED_24), 14);
assert.equal(typeOn("2027-03-01", CLEARED_36), "pre_14_10");
assert.equal(typeOn("2027-03-01", NOT_CLEARED), "pre_14_10");
assert.equal(typeOn("2027-04-05", CLEARED_36), "pre_14_10");
assert.equal(hoursOn("2027-04-05", CLEARED_36), 14);

// --- Coach house labels ---
assert.equal(monthLabel(aug27), "Pre-Day 1");
assert.equal(formatCoachWhere(aug27), "Boot Camp · Pre-Day 1 · Day 10 of 14");
assert.ok(!formatCoachWhere(aug27).includes("of 90"));
assert.equal(extendedFastProtocol(aug27).overnightOnly, true);
assert.equal(extendedFastProtocol(aug27).inProtocol24h, false);
assert.equal(extendedFastProtocol(aug27).inProtocol36h, false);
assert.match(extendedFastProtocol(aug27).label, /not in protocol/i);
assert.match(extendedFastProtocol(aug27).label, /Boot Camp/);
assert.ok(!/Basic Training/.test(extendedFastProtocol(aug27).label));

const coachAug27 = coachProgramSnapshot(START, "2026-08-27", "2026-08-26", true);
assert.equal(coachAug27.blockLabel, "Boot Camp");
assert.equal(coachAug27.monthLabel, "Pre-Day 1");
assert.equal(coachAug27.whereLine, "Boot Camp · Pre-Day 1 · Day 10 of 14");
assert.equal(coachAug27.missingLog, false);
assert.equal(coachAug27.physicianClearedExtendedFasts, true);
assert.equal(coachAug27.extendedFast24hInProtocol, false);
assert.equal(coachAug27.overnightOnly, true);

assert.equal(monthLabel(sep1), "LoadLine 30");
assert.equal(formatCoachWhere(sep1), "LoadLine 30 · Day 1 of 30");
assert.equal(extendedFastProtocol(sep1).overnightOnly, true);
assert.equal(extendedFastProtocol(sep1).inProtocol24h, false);
assert.match(extendedFastProtocol(sep1).label, /LoadLine 30/);
assert.ok(!/The Ninety/.test(extendedFastProtocol(sep1).label));

const coachSep1 = coachProgramSnapshot(START, "2026-09-01", "2026-08-31", true);
assert.equal(coachSep1.blockLabel, "LoadLine 30");
assert.equal(coachSep1.monthLabel, "LoadLine 30");
assert.equal(coachSep1.position.programDay, 1);
assert.equal(coachSep1.extendedFast24hInProtocol, false);

const coachOct1 = coachProgramSnapshot(START, "2026-10-01", "2026-09-30", true);
assert.equal(coachOct1.blockLabel, "LoadLine 60");
assert.ok(!coachOct1.whereLine.includes("The Ninety"));
assert.ok(!coachOct1.whereLine.includes("Month 2"));

const coachDay90 = coachProgramSnapshot(START, "2026-11-29", "2026-11-29", true);
assert.equal(coachDay90.blockLabel, "LoadLine 90");
assert.equal(coachDay90.position.ninetyPhase, null);

const coachDay91 = coachProgramSnapshot(START, "2026-11-30", "2026-11-29", true);
assert.equal(coachDay91.blockLabel, "LoadLine 180");
assert.ok(!coachDay91.whereLine.includes("The Build"));
assert.ok(!coachDay91.whereLine.includes("Identity"));
assert.equal(coachDay91.overnightOnly, true);
assert.equal(coachDay91.extendedFast24hInProtocol, false);

const coachM7 = coachProgramSnapshot(START, "2027-02-28", "2027-02-27", true);
assert.equal(coachM7.blockLabel, "LoadLine 365");
assert.equal(coachM7.extendedFast24hInProtocol, false);
assert.equal(coachM7.extendedFast36hInProtocol, false);

const coachNomad = coachProgramSnapshot(START, "2027-09-01", "2027-08-31", true);
assert.equal(coachNomad.blockLabel, "NOMAD");
assert.ok(!/No Excuses Nomad/.test(coachNomad.blockLabel));

assert.equal(isMissingLog(null, "2026-08-27"), true);
assert.equal(isMissingLog("2026-08-27", "2026-08-27"), false);
assert.equal(isMissingLog("2026-08-26", "2026-08-27"), false);
assert.equal(isMissingLog("2026-08-25", "2026-08-27"), true);

const missing = coachProgramSnapshot(START, "2026-08-27", null, false);
assert.equal(missing.missingLog, true);
assert.equal(missing.daysSinceCheckIn, null);

assert.equal(isBeforeDay1(aug27.block), true);
assert.equal(isBeforeDay1(sep1.block), false);
assert.equal(isBeforeDay1(oct1.block), false);
assert.equal(day90InterviewStatus(aug27), "not_yet");
assert.equal(day90InterviewStatus(sep1), "not_yet");
assert.equal(day90InterviewStatus(nov29), "not_yet");
assert.equal(formatMonthLabel(aug27), "Boot Camp 10/14");
assert.equal(formatMonthLabel(sep1), "Day 1 of 30");
assert.equal(formatMonthLabel(oct1), "LoadLine 60");

console.log("program-position tests passed");
