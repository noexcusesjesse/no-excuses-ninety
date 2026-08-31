"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MealTheme } from "@/lib/meal-themes";
import { emptyLogFormValues, type TodayLogFormValues } from "@/lib/daily-log";

const inputClass =
  "flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const textInputClass =
  "flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function payloadFromForm(form: HTMLFormElement): Record<string, string> {
  const fd = new FormData(form);
  const body: Record<string, string> = {};
  fd.forEach((value, key) => {
    if (typeof value === "string") body[key] = value;
  });
  return body;
}

export function LogForm({
  theme,
  initial,
}: {
  theme: MealTheme;
  initial?: TodayLogFormValues;
}) {
  const defaults = initial ?? emptyLogFormValues("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaved(false);
        setError(null);
        setSaving(true);
        try {
          const res = await fetch("/api/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadFromForm(e.currentTarget)),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => null);
            setError(typeof json?.error === "string" ? json.error : "Could not save today's log");
            return;
          }
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch {
          setError("Could not save today's log");
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-4"
    >
      {/* Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
          <CardDescription>Weight and waist (optional today)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Weight (lb)</label>
            <input type="number" step="0.1" name="weight" defaultValue={defaults.weight} className={inputClass} placeholder="—" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Waist (in)</label>
            <input type="number" step="0.1" name="waist" defaultValue={defaults.waist} className={inputClass} placeholder="—" />
          </div>
        </CardContent>
      </Card>

      {/* Daily targets */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s numbers</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Water (oz)</label>
            <input type="number" name="water" defaultValue={defaults.water} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Calories</label>
            <input type="number" name="calories" defaultValue={defaults.calories} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Protein (g)</label>
            <input type="number" name="protein" defaultValue={defaults.protein} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Steps</label>
            <input type="number" name="steps" defaultValue={defaults.steps} className={inputClass} placeholder="0" />
          </div>
        </CardContent>
      </Card>

      {/* Fasting — display only. Timer lives on Dashboard; do not clobber fast columns. */}
      <Card>
        <CardHeader>
          <CardTitle>Fasting</CardTitle>
          <CardDescription>Start and end the timer on Dashboard. Saving this log does not change an in-progress fast.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fasting hours</label>
            <input type="number" name="fastingHours" className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Fasting window</label>
            <div className="flex gap-2">
              <button type="button" className="flex-1 rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Completed</button>
              <button type="button" className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:border-primary">Modified</button>
              <button type="button" className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:border-primary">Did not fast</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Workout done</label>
            <select name="workoutDone" defaultValue={defaults.workoutDone} className={textInputClass}>
              <option value="">—</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Walk (min)</label>
            <input type="number" name="walkMinutes" defaultValue={defaults.walkMinutes} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
            <select name="exerciseType" className={textInputClass}>
              <option value="none">None</option>
              <option value="walking">Walking</option>
              <option value="cardio">Cardio</option>
              <option value="strength">Strength</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Minutes</label>
            <input type="number" name="exerciseMinutes" className={inputClass} placeholder="0" />
          </div>
        </CardContent>
      </Card>

      {/* Recovery — schema columns the coach already reads */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery</CardTitle>
          <CardDescription>Sleep, CPAP, mood, energy</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sleep (h)</label>
            <input type="number" step="0.1" name="sleepHours" defaultValue={defaults.sleepHours} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">CPAP (h)</label>
            <input type="number" step="0.1" name="cpapHours" defaultValue={defaults.cpapHours} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mood (1–5)</label>
            <input type="number" min={1} max={5} name="mood" defaultValue={defaults.mood} className={inputClass} placeholder="—" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Energy (1–5)</label>
            <input type="number" min={1} max={5} name="energy" defaultValue={defaults.energy} className={inputClass} placeholder="—" />
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <Card>
        <CardHeader>
          <CardTitle>Meals</CardTitle>
          <CardDescription>What you actually ate (not the suggestion)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Meal 1", name: "meal1", hint: theme.meal1Hint, value: defaults.meal1 },
            { label: "Meal 2", name: "meal2", hint: theme.meal2Hint, value: defaults.meal2 },
            { label: "Snack", name: "snack", hint: theme.snackHint, value: defaults.snack },
            { label: "Power Up", name: "powerup", hint: theme.powerUpHint, value: defaults.powerup },
          ].map((meal) => (
            <div key={meal.label}>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {meal.label} <span className="text-muted-foreground/60">· {meal.hint}</span>
              </label>
              <input
                type="text"
                name={meal.name}
                defaultValue={meal.value}
                className={textInputClass}
                placeholder={`What you ate for ${meal.label.toLowerCase()}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            name="notes"
            rows={3}
            defaultValue={defaults.notes}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Any pain, unusual symptoms, or notes for your coach"
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? "Saving…" : "Save today's log"}
        </Button>
        {saved && <span className="text-sm text-success">Saved ✓</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
