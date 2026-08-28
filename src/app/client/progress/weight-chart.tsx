"use client";

import type { WeightEntry } from "@/db/queries";

export function WeightChart({ data, goalWeight }: { data: WeightEntry[]; goalWeight: number }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No weight data yet. Start logging to see your trend.
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const padding = 40;

  // Find min/max for scaling
  const weights = data.map((d) => d.weightLb);
  const minWeight = Math.min(...weights, goalWeight) - 5;
  const maxWeight = Math.max(...weights, goalWeight) + 5;
  const weightRange = maxWeight - minWeight;

  // X scale: dates to x coordinates
  const dates = data.map((d) => new Date(d.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  const xScale = (dateMs: number) =>
    padding + ((dateMs - minDate) / dateRange) * (width - 2 * padding);
  const yScale = (weight: number) =>
    height - padding - ((weight - minWeight) / weightRange) * (height - 2 * padding);

  // Build the weight line path
  const weightPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(new Date(d.date).getTime())} ${yScale(d.weightLb)}`)
    .join(" ");

  // Goal line (dashed)
  const goalY = yScale(goalWeight);

  // 7-day rolling average
  const rollingAvg = data.map((d, i) => {
    const start = Math.max(0, i - 6);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, w) => sum + w.weightLb, 0) / window.length;
    return { date: d.date, avg };
  });
  const avgPath = rollingAvg
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(new Date(d.date).getTime())} ${yScale(d.avg)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxHeight: "300px" }}
    >
      {/* Grid lines */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="hsl(var(--muted))" strokeWidth="0.5" opacity="0.3" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="hsl(var(--muted))" strokeWidth="0.5" opacity="0.3" />

      {/* Goal reference line (dashed) */}
      <line
        x1={padding}
        y1={goalY}
        x2={width - padding}
        y2={goalY}
        stroke="hsl(var(--success))"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.6"
      />
      <text x={width - padding} y={goalY - 6} textAnchor="end" fontSize="10" fill="hsl(var(--success))" fontFamily="ui-monospace, monospace">
        Goal: {goalWeight} lb
      </text>

      {/* Weight line (thin, muted) */}
      <path d={weightPath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />

      {/* 7-day rolling average (bold, accent) */}
      <path d={avgPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(new Date(d.date).getTime())}
          cy={yScale(d.weightLb)}
          r="3"
          fill="hsl(var(--primary))"
        />
      ))}

      {/* Labels */}
      <text x={padding} y={height - 10} fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="ui-monospace, monospace">
        {new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </text>
      <text x={width - padding} y={height - 10} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="ui-monospace, monospace">
        {new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </text>
    </svg>
  );
}
