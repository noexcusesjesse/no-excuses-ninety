import * as React from "react";
import { Check } from "lucide-react";

export function Stat({
  icon: Icon,
  label,
  value,
  target,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const hit = value >= target;
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px]">{pct}%</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">/ {target}{unit}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        {hit && <Check className="h-3 w-3 text-success" />}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${hit ? "bg-success" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MoodPicker() {
  const faces = ["😞", "😐", "🙂", "😄", "🔥"];
  return (
    <div className="flex gap-1">
      {faces.map((f, i) => (
        <button
          key={i}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-lg transition-colors hover:border-primary hover:bg-accent"
          aria-label={`Mood ${i + 1} of 5`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
