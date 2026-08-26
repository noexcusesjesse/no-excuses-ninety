"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CalibrationEntry {
  id: string;
  tubeColor: string;
  length: string;
  cleanReps: number | null;
  perceivedResistance: number | null;
  startingLevel: string;
  createdAt: number;
}

const TUBE_COLORS = ["Yellow", "Red", "Green", "Blue", "Black"];

export function BandCalibrationPanel({
  clientId,
  calibration,
}: {
  clientId: string;
  calibration: CalibrationEntry[];
}) {
  const [entries, setEntries] = useState<CalibrationEntry[]>(calibration);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState(
    TUBE_COLORS.map((color) => ({
      tubeColor: color,
      length: "",
      cleanReps: "",
      perceivedResistance: "",
      startingLevel: "",
    })),
  );

  async function saveCalibration() {
    setSaving(true);
    const validEntries = forms.filter(
      (f) => f.cleanReps || f.perceivedResistance || f.startingLevel,
    );
    if (validEntries.length === 0) {
      setSaving(false);
      setShowForm(false);
      return;
    }

    try {
      const res = await fetch("/api/coach/band-calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          entries: validEntries.map((f) => ({
            tubeColor: f.tubeColor,
            length: f.length || "standard",
            cleanReps: f.cleanReps ? parseInt(f.cleanReps) : null,
            perceivedResistance: f.perceivedResistance ? parseInt(f.perceivedResistance) : null,
            startingLevel: f.startingLevel || "",
          })),
        }),
      });
      if (res.ok) {
        // Refresh — just add new entries locally
        const newEntries = validEntries
          .filter((f) => f.cleanReps || f.perceivedResistance || f.startingLevel)
          .map((f, i) => ({
            id: `new-${Date.now()}-${i}`,
            tubeColor: f.tubeColor,
            length: f.length || "standard",
            cleanReps: f.cleanReps ? parseInt(f.cleanReps) : null,
            perceivedResistance: f.perceivedResistance ? parseInt(f.perceivedResistance) : null,
            startingLevel: f.startingLevel || "",
            createdAt: Date.now(),
          }));
        setEntries((prev) => [...newEntries, ...prev]);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase text-muted-foreground">
                <th className="py-2 pr-4">Tube</th>
                <th className="py-2 pr-4">Length</th>
                <th className="py-2 pr-4">Clean Reps</th>
                <th className="py-2 pr-4">Resistance (1-10)</th>
                <th className="py-2 pr-4">Starting Level</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((c) => (
                <tr key={c.id} className="border-b border-border/50 font-mono text-xs tabular-nums">
                  <td className="py-2 pr-4">{c.tubeColor}</td>
                  <td className="py-2 pr-4">{c.length}</td>
                  <td className="py-2 pr-4">{c.cleanReps ?? "—"}</td>
                  <td className="py-2 pr-4">{c.perceivedResistance ?? "—"}</td>
                  <td className="py-2 pr-4">{c.startingLevel || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!showForm && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No calibration logged yet.</p>
      )}

      {!showForm ? (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          {entries.length > 0 ? "Add new calibration" : "Log Day 1 calibration"}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            For each tube, do band rows for as many clean reps as possible. Record clean reps to form breakdown and perceived resistance (1-10).
          </p>
          {forms.map((f, i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">{f.tubeColor}</label>
                <div className="flex h-9 items-center px-2 text-sm">{f.tubeColor}</div>
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Length</label>
                <input
                  type="text"
                  value={f.length}
                  onChange={(e) => setForms((prev) => prev.map((p, j) => j === i ? { ...p, length: e.target.value } : p))}
                  className="flex h-9 w-full rounded-md border border-border bg-input px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="short/long"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Clean Reps</label>
                <input
                  type="number"
                  value={f.cleanReps}
                  onChange={(e) => setForms((prev) => prev.map((p, j) => j === i ? { ...p, cleanReps: e.target.value } : p))}
                  className="flex h-9 w-full rounded-md border border-border bg-input px-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">1-10</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={f.perceivedResistance}
                  onChange={(e) => setForms((prev) => prev.map((p, j) => j === i ? { ...p, perceivedResistance: e.target.value } : p))}
                  className="flex h-9 w-full rounded-md border border-border bg-input px-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Level</label>
                <input
                  type="text"
                  value={f.startingLevel}
                  onChange={(e) => setForms((prev) => prev.map((p, j) => j === i ? { ...p, startingLevel: e.target.value } : p))}
                  className="flex h-9 w-full rounded-md border border-border bg-input px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="light/med/heavy"
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={saveCalibration} disabled={saving}>Save calibration</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
