/**
 * 14:10 meal-window math. Run: npm run test:meal-window
 */
import assert from "node:assert/strict";
import {
  DEFAULT_BED,
  DEFAULT_WAKE,
  EATING_HOURS,
  FAST_HOURS,
  MIN_MEAL_GAP_MIN,
  TRE_PROTOCOL,
  computeEatingWindow,
  formatClock12,
  formatClock24,
  parseClock,
  placeMealSlots,
} from "./meal-window";

assert.equal(TRE_PROTOCOL, "14:10");
assert.equal(EATING_HOURS, 10);
assert.equal(FAST_HOURS, 14);

assert.equal(parseClock("06:30"), 6 * 60 + 30);
assert.equal(parseClock("22:30"), 22 * 60 + 30);
assert.equal(parseClock("24:00"), null);
assert.equal(parseClock("9:00"), 9 * 60);
assert.equal(formatClock24(6 * 60 + 30), "06:30");
assert.equal(formatClock12(6 * 60 + 30), "6:30 AM");
assert.equal(formatClock12(19 * 60 + 30), "7:30 PM");

// Packet default: last meal 7:30 PM, open 9:30 AM.
const packet = computeEatingWindow(DEFAULT_WAKE, DEFAULT_BED);
assert.ok(packet);
assert.equal(packet.protocol, "14:10");
assert.equal(formatClock24(packet.openMinutes), "09:30");
assert.equal(formatClock24(packet.closeMinutes), "19:30");
assert.equal(packet.eatingMinutes, 10 * 60);
assert.equal(packet.fitsFullWindow, true);
assert.equal(packet.slots[0].label, "Break fast");
assert.equal(packet.slots[1].label, "Meal A");
assert.equal(packet.slots[2].label, "Meal B");
assert.equal(formatClock12(packet.slots[0].minutes), "9:30 AM");
assert.equal(formatClock12(packet.slots[1].minutes), "2:30 PM");
assert.equal(formatClock12(packet.slots[2].minutes), "7:30 PM");

// Preferred 3h buffer: 6:00 wake / 22:00 bed → 9:00–7:00.
const even = computeEatingWindow("06:00", "22:00");
assert.ok(even);
assert.equal(formatClock24(even.openMinutes), "09:00");
assert.equal(formatClock24(even.closeMinutes), "19:00");

// Wake collision: shift so the 10h window still fits the day.
const lateWake = computeEatingWindow("10:00", "22:00");
assert.ok(lateWake);
assert.equal(formatClock24(lateWake.openMinutes), "10:00");
assert.equal(formatClock24(lateWake.closeMinutes), "20:00");
assert.equal(lateWake.fitsFullWindow, true);

// Too short for 10h + 2h min buffer — keep 14:10 lock, shrink the span.
const shortDay = computeEatingWindow("12:00", "22:00");
assert.ok(shortDay);
assert.equal(formatClock24(shortDay.openMinutes), "12:00");
assert.equal(formatClock24(shortDay.closeMinutes), "20:00");
assert.equal(shortDay.eatingMinutes, 8 * 60);
assert.equal(shortDay.fitsFullWindow, false);
assert.equal(shortDay.protocol, "14:10");

// Bedtime after midnight.
const nightOwl = computeEatingWindow("07:00", "00:30");
assert.ok(nightOwl);
assert.equal(formatClock24(nightOwl.closeMinutes), "21:30");
assert.equal(formatClock24(nightOwl.openMinutes), "11:30");

// Three meals stay ≥ 3h apart on a full window.
for (const slot of [packet, even, lateWake]) {
  assert.ok(slot);
  const [a, b, c] = slot.slots;
  assert.ok(b.minutes - a.minutes >= MIN_MEAL_GAP_MIN);
  assert.ok(c.minutes - b.minutes >= MIN_MEAL_GAP_MIN);
}

const packed = placeMealSlots(12 * 60, 20 * 60);
assert.equal(packed[1].minutes, 16 * 60);

console.log("meal-window tests passed");
