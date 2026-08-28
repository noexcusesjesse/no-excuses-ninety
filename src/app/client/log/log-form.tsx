"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MealTheme } from "@/lib/meal-themes";

export function LogForm({ theme }: { theme: MealTheme }) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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
            <input type="number" step="0.1" name="weight" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="—" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Waist (in)</label>
            <input type="number" step="0.1" name="waist" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="—" />
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
            <input type="number" name="water" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Calories</label>
            <input type="number" name="calories" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Protein (g)</label>
            <input type="number" name="protein" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Steps</label>
            <input type="number" name="steps" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
          </div>
        </CardContent>
      </Card>

      {/* Fasting */}
      <Card>
        <CardHeader>
          <CardTitle>Fasting</CardTitle>
          <CardDescription>Fasting hours + window status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fasting hours</label>
            <input type="number" name="fastingHours" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
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
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
            <select name="exerciseType" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="none">None</option>
              <option value="walking">Walking</option>
              <option value="cardio">Cardio</option>
              <option value="strength">Strength</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Minutes</label>
            <input type="number" name="exerciseMinutes" className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0" />
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
            { label: "Meal 1", hint: theme.meal1Hint },
            { label: "Meal 2", hint: theme.meal2Hint },
            { label: "Snack", hint: theme.snackHint },
            { label: "Power Up", hint: theme.powerUpHint },
          ].map((meal) => (
            <div key={meal.label}>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {meal.label} <span className="text-muted-foreground/60">· {meal.hint}</span>
              </label>
              <input
                type="text"
                name={meal.label.toLowerCase().replace(" ", "")}
                className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Any pain, unusual symptoms, or notes for your coach"
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" className="flex-1">Save today&apos;s log</Button>
        {saved && <span className="text-sm text-success">Saved ✓</span>}
      </div>
    </form>
  );
}
