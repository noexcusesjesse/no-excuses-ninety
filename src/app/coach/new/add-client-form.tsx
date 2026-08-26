"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AddClientForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    startDate: new Date().toISOString().slice(0, 10),
    startWeightLb: "",
    heightIn: "",
    dateOfBirth: "",
    physicianClearedExtendedFasts: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.startDate || !form.startWeightLb) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          startDate: form.startDate,
          startWeightLb: parseFloat(form.startWeightLb),
          heightIn: form.heightIn ? parseFloat(form.heightIn) : undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          physicianClearedExtendedFasts: form.physicianClearedExtendedFasts,
        }),
      });
      if (res.ok) {
        router.push("/coach");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create client");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="jane@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Start Date *</label>
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Start Weight (lb) *</label>
          <input
            type="number"
            required
            step="0.1"
            value={form.startWeightLb}
            onChange={(e) => setForm({ ...form, startWeightLb: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="300"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Height (in)</label>
          <input
            type="number"
            step="0.1"
            value={form.heightIn}
            onChange={(e) => setForm({ ...form, heightIn: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="72"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date of Birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="physicianCleared"
          checked={form.physicianClearedExtendedFasts}
          onChange={(e) => setForm({ ...form, physicianClearedExtendedFasts: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <label htmlFor="physicianCleared" className="text-sm text-muted-foreground">
          Physician cleared for extended fasts (24h+)
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create client"}
        </Button>
        <Link href="/coach">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
