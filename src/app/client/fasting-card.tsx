"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Play, Square } from "lucide-react";

interface FastingData {
  date: string;
  fastType: string;
  label: string;
  color: string;
  targetHours: number;
  maxHours: number;
  isActive: boolean;
  activeStartMs: number | null;
  activeElapsedMs: number | null;
}

function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function FastingCard() {
  const [data, setData] = useState<FastingData | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/fasting/today", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.isActive && json.activeStartMs) {
          setElapsed(Date.now() - json.activeStartMs);
        }
      }
    } catch {
      // silently fail — the card just won't show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  // Live countdown when fasting
  useEffect(() => {
    if (!data?.isActive || !data.activeStartMs) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - (data.activeStartMs ?? 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.isActive, data?.activeStartMs]);

  async function handleStart() {
    setError(null);
    const res = await fetch("/api/fasting/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    if (!res.ok) setError("Failed to start fast");
    await fetchToday();
  }

  async function handleEnd() {
    setError(null);
    const res = await fetch("/api/fasting/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    if (!res.ok) setError("Failed to end fast");
    await fetchToday();
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fasting</CardTitle>
          <CardDescription>Loading today&apos;s fasting plan…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) return null;

  const progress = data.targetHours > 0 ? Math.min(100, (elapsed / (data.targetHours * 3600000)) * 100) : 0;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-4 w-4" style={{ color: data.color }} />
              Fasting
            </CardTitle>
            <CardDescription className="mt-1">{data.label}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* Circular progress ring */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              opacity="0.3"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={data.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {data.isActive ? formatElapsed(elapsed) : `${data.targetHours}h`}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {data.isActive ? "elapsed" : "target"}
            </span>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {data.isActive ? (
          <Button variant="outline" onClick={handleEnd} className="w-full">
            <Square className="h-4 w-4" />
            Break fast
          </Button>
        ) : (
          <Button onClick={handleStart} className="w-full">
            <Play className="h-4 w-4" />
            Start fast
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
