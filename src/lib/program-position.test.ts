/**
 * Program position + fasting gate checks. Run: npx tsx src/lib/program-position.test.ts
 */
import assert from "node:assert/strict";
import {
  FIRST_COHORT_DAY_ONE,
  formatPositionKicker,
  formatPositionSecondary,
  getDayPlan,
  getProgramPosition,
  isOvernightOnlyBlock,
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

// --- First-cohort calendar ---
const aug27 = getProgramPosition(START, "2026-08-27");
assert.equal(aug27.block, "basicTraining");
assert.equal(aug27.dayInBlock, 10);
assert.equal(aug27.daysInBlock, 14);
assert.equal(aug27.programMonth, null);
assert.equal(aug27.ninetyPhase, null);
assert.equal(aug27.basicTrainingStartDate, "2026-08-18");
assert.equal(aug27.startDate, "2026-09-01");
assert.equal(isOvernightOnlyBlock(aug27.block), true);
assert.equal(formatPositionKicker(aug27, "Thu"), "Thu · Basic Training · Runway day 10 of 14");
assert.equal(formatPositionSecondary(aug27), "The Ninety starts Sep 1, 2026");
assert.ok(!formatPositionKicker(aug27, "Thu").includes("of 90"));

const aug18 = getProgramPosition(START, "2026-08-18");
assert.equal(aug18.block, "basicTraining");
assert.equal(aug18.dayInBlock, 1);

const aug31 = getProgramPosition(START, "2026-08-31");
assert.equal(aug31.block, "basicTraining");
assert.equal(aug31.dayInBlock, 14);

const sep1 = getProgramPosition(START, "2026-09-01");
assert.equal(sep1.block, "ninety");
assert.equal(sep1.programMonth, 1);
assert.equal(sep1.programDay, 1);
assert.equal(sep1.dayInBlock, 1);
assert.equal(sep1.ninetyPhase, "Foundation");
assert.equal(sep1.isDeload, false);
assert.equal(formatPositionKicker(sep1, "Tue"), "Tue · The Ninety · Month 1 Foundation");
assert.equal(formatPositionSecondary(sep1), "Day 1 of 90");

const day90 = getProgramPosition(START, "2026-11-29");
assert.equal(day90.block, "ninety");
assert.equal(day90.programDay, 90);
assert.equal(day90.programMonth, 3);
assert.equal(day90.ninetyPhase, "Identity");
assert.equal(day90.ninetyEndDate, "2026-11-29");

const day91 = getProgramPosition(START, "2026-11-30");
assert.equal(day91.block, "build");
assert.equal(day91.programDay, 91);
assert.equal(day91.programMonth, 4);
assert.equal(day91.ninetyPhase, null);
assert.equal(formatPositionKicker(day91, "Mon"), "Mon · The Build · Month 4 of 15");
assert.ok(!formatPositionKicker(day91, "Mon").includes("Identity"));

assert.equal(programEndDate(START), "2027-11-30");
const lastDay = getProgramPosition(START, "2027-11-30");
assert.equal(lastDay.block, "mastery");
assert.equal(lastDay.programMonth, 15);

const after = getProgramPosition(START, "2027-12-01");
assert.equal(after.block, "complete");

const month7start = getProgramPosition(START, "2027-02-28");
assert.equal(month7start.programMonth, 7);
assert.equal(month7start.block, "build");
assert.equal(month7start.extendedFast24hEligibleByMonth, true);
assert.equal(month7start.extendedFast36hEligibleByMonth, false);

const month6end = getProgramPosition(START, "2027-02-27");
assert.equal(month6end.programMonth, 6);
assert.equal(month6end.extendedFast24hEligibleByMonth, false);

const month8start = getProgramPosition(START, "2027-03-30");
assert.equal(month8start.programMonth, 8);
assert.equal(month8start.extendedFast24hEligibleByMonth, true);
assert.equal(month8start.extendedFast36hEligibleByMonth, true);

// Deloads weeks 4, 8, 12 of The Ninety
assert.equal(getProgramPosition(START, "2026-09-22").isDeload, true); // day 22, week 4
assert.equal(getProgramPosition(START, "2026-09-21").isDeload, false); // day 21, week 3

// Saturday fasted walk is calendar Saturday
const sat = getDayPlan(getProgramPosition(START, "2026-08-29"));
assert.equal(sat.dayLabel, "Sat");
assert.equal(sat.isFastedWalk, true);
assert.equal(sat.walkMinutes, 60);

// --- Fasting gates ---
// Monday during Basic Training (Aug 24 2026), cleared → overnight, not 24h
assert.equal(typeOn("2026-08-24", CLEARED_24), "overnight_12_14");
assert.equal(typeOn("2026-08-24", CLEARED_36), "overnight_12_14");

// Thursday Aug 27 — overnight
assert.equal(typeOn("2026-08-27", CLEARED_24), "overnight_12_14");

// Day 1 of The Ninety (Tue) — overnight, no 24h/36h
assert.equal(typeOn("2026-09-01", CLEARED_24), "overnight_12_14");
assert.equal(typeOn("2026-09-01", CLEARED_36), "overnight_12_14");

// Monday in The Ninety (Sep 7), cleared + 36h variant → still overnight
assert.equal(typeOn("2026-09-07", CLEARED_36), "overnight_12_14");
assert.equal(hoursOn("2026-09-07", CLEARED_36), 13);

// TRE days during The Ninety (Wed Sep 2) → overnight, not 16:8
assert.equal(typeOn("2026-09-02", CLEARED_24), "overnight_12_14");

// Monday in Month 4 (Dec 7 2026) — Build, month < 7 → TRE, not 24h
assert.equal(getProgramPosition(START, "2026-12-07").programMonth, 4);
assert.equal(typeOn("2026-12-07", CLEARED_24), "tre_16_8");
assert.equal(typeOn("2026-12-07", CLEARED_36), "tre_16_8");

// TRE allowed in The Build
assert.equal(typeOn("2026-12-09", CLEARED_24), "tre_16_8"); // Wed

// Monday Month 7 (Mar 1 2027) cleared → 24h, even with 36h variant
assert.equal(getProgramPosition(START, "2027-03-01").programMonth, 7);
assert.equal(typeOn("2027-03-01", CLEARED_24), "reset_24hr");
assert.equal(hoursOn("2027-03-01", CLEARED_24), 24);
assert.equal(typeOn("2027-03-01", CLEARED_36), "reset_24hr");
assert.equal(hoursOn("2027-03-01", CLEARED_36), 24);
assert.equal(typeOn("2027-03-01", NOT_CLEARED), "tre_16_8");

// Monday Month 8 (Apr 5 2027) cleared + 36h variant → 36h
assert.equal(getProgramPosition(START, "2027-04-05").programMonth, 8);
assert.equal(typeOn("2027-04-05", CLEARED_36), "reset_24hr");
assert.equal(hoursOn("2027-04-05", CLEARED_36), 36);
assert.equal(hoursOn("2027-04-05", CLEARED_24), 24);

console.log("program-position tests passed");
