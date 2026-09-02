"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LAST_MEAL_WINDOW, MEAL_WINDOW_LABEL } from "@/lib/program-position";
import {
  DEFAULT_BED,
  DEFAULT_WAKE,
  TRE_PROTOCOL,
  computeEatingWindow,
  formatClock12,
  formatClock24,
  parseClock,
  timelinePercents,
  type MealSlotId,
} from "@/lib/meal-window";
import { Clock } from "lucide-react";

const STORAGE_KEY = "ll-meal-window-v1";

type LoggedSlots = Partial<Record<MealSlotId, string>>;

interface DeviceState {
  date: string;
  wake: string;
  bed: string;
  slots: LoggedSlots;
}

function todayISOPhoenix(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Phoenix" });
}

function readDeviceState(): DeviceState {
  const today = todayISOPhoenix();
  const empty: DeviceState = { date: today, wake: DEFAULT_WAKE, bed: DEFAULT_BED, slots: {} };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as DeviceState;
    if (!parsed || typeof parsed.wake !== "string" || typeof parsed.bed !== "string") return empty;
    return {
      date: today,
      wake: parsed.wake,
      bed: parsed.bed,
      slots: parsed.date === today ? parsed.slots ?? {} : {},
    };
  } catch {
    return empty;
  }
}

function writeDeviceState(state: DeviceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** LoadLine 30 packet: 14:10 meal window. No 24h / 36h UI. No protocol picker. */
export function MealWindowCard() {
  const [wake, setWake] = useState(DEFAULT_WAKE);
  const [bed, setBed] = useState(DEFAULT_BED);
  const [logged, setLogged] = useState<LoggedSlots>({});
  const [draft, setDraft] = useState<LoggedSlots>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readDeviceState();
    setWake(stored.wake);
    setBed(stored.bed);
    setLogged(stored.slots);
    setDraft(stored.slots);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeDeviceState({ date: todayISOPhoenix(), wake, bed, slots: logged });
  }, [hydrated, wake, bed, logged]);

  const window = useMemo(() => computeEatingWindow(wake, bed), [wake, bed]);
  const marks = window ? timelinePercents(window) : null;

  function logSlot(id: MealSlotId) {
    const suggested = window ? formatClock24(window.slots.find((s) => s.id === id)?.minutes ?? 0) : DEFAULT_WAKE;
    const time = draft[id] || suggested;
    setLogged((prev) => ({ ...prev, [id]: time }));
    setDraft((prev) => ({ ...prev, [id]: time }));
  }

  function clearSlot(id: MealSlotId) {
    setLogged((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <Card className="border-[#1B2A4A]/40">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#C89B3C]">
              <Clock className="h-4 w-4" />
              Meal window
            </CardTitle>
            <CardDescription className="mt-1">
              TRE {MEAL_WINDOW_LABEL} only — 14 hours not eating, 10 hour eating window.
              Last meal {LAST_MEAL_WINDOW} when bedtime is around 10:30 PM.
            </CardDescription>
          </div>
          <span className="shrink-0 rounded-full bg-[#1B2A4A] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-[#C89B3C]">
            {TRE_PROTOCOL}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Wake</span>
            <input
              type="time"
              value={wake}
              onChange={(e) => setWake(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-input px-3 font-mono text-sm tabular-nums focus:border-[#C89B3C] focus:outline-none focus:ring-1 focus:ring-[#C89B3C]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Bedtime</span>
            <input
              type="time"
              value={bed}
              onChange={(e) => setBed(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-input px-3 font-mono text-sm tabular-nums focus:border-[#C89B3C] focus:outline-none focus:ring-1 focus:ring-[#C89B3C]"
            />
          </label>
        </div>

        {window && marks && (
          <>
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-[#C89B3C]">
                  {formatClock12(window.openMinutes)} – {formatClock12(window.closeMinutes)}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {window.fitsFullWindow
                    ? "10h eating · 14h not eating"
                    : `${Math.round(window.eatingMinutes / 60)}h eating · still ${TRE_PROTOCOL}`}
                </p>
              </div>
              <div className="relative h-8 overflow-hidden rounded-md bg-[#0b2f63]">
                <div
                  className="absolute inset-y-0 bg-[#C89B3C]"
                  style={{ left: `${marks.openPct}%`, width: `${marks.widthPct}%` }}
                />
                {window.slots.map((slot) => (
                  <span
                    key={slot.id}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b2f63] bg-white"
                    style={{ left: `${marks.slotPcts[slot.id]}%` }}
                    title={`${slot.label} ${formatClock12(slot.minutes)}`}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <span>Wake {formatClock12(window.wakeMinutes)}</span>
                <span>Open</span>
                <span>Close</span>
                <span>Bed {formatClock12(window.bedMinutes)}</span>
              </div>
            </div>

            <ol className="space-y-3">
              {window.slots.map((slot) => {
                const eaten = logged[slot.id];
                return (
                  <li
                    key={slot.id}
                    className="flex flex-col gap-2 rounded-md border border-border bg-[#1B2A4A]/20 px-3 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-[8.5rem]">
                      <p className="text-sm font-medium">{slot.label}</p>
                      <p className="font-mono text-[11px] text-[#C89B3C]">
                        Slot {formatClock12(slot.minutes)}
                      </p>
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="time"
                        value={draft[slot.id] ?? formatClock24(slot.minutes)}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                        className="flex h-9 w-full max-w-[9rem] rounded-md border border-border bg-input px-3 font-mono text-sm tabular-nums focus:border-[#C89B3C] focus:outline-none focus:ring-1 focus:ring-[#C89B3C]"
                        aria-label={`${slot.label} time`}
                      />
                      {eaten ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => clearSlot(slot.id)}>
                          Clear
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="bg-[#1B2A4A] text-[#C89B3C] hover:bg-[#1B2A4A]/80"
                          onClick={() => logSlot(slot.id)}
                        >
                          I ate
                        </Button>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground sm:text-right">
                      {eaten ? `Logged ${formatClock12(parseClock(eaten) ?? 0)}` : "Not a calorie diary"}
                    </p>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Eat inside the window. This is not a 24h or 36h fast, and not medical advice.
          Wake, bedtime, and slot times stay on this device today — they are not written
          to Postgres or the daily log.
        </p>
      </CardContent>
    </Card>
  );
}
