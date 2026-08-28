"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGE_CHARS, audienceLabel, type BroadcastAudience, type ProgramNotice } from "@/lib/message-types";

const OPTIONS: { value: BroadcastAudience; label: string }[] = [
  { value: "all", label: "All users (clients + coaches)" },
  { value: "clients", label: "Clients only" },
  { value: "coaches", label: "Coaches only" },
];

export function BroadcastComposer({ initial }: { initial: ProgramNotice[] }) {
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!body.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send");
        return;
      }
      setSent((prev) => [data.notice as ProgramNotice, ...prev]);
      setBody("");
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as BroadcastAudience)}
          className="flex h-10 rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Program message. Recipients see this as LoadLine, not Staff."
        rows={3}
        maxLength={MAX_MESSAGE_CHARS}
        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        disabled={saving}
      />
      <div className="flex items-center gap-3">
        <Button onClick={send} disabled={saving || !body.trim()}>
          Send broadcast
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      {sent.length > 0 && (
        <div className="space-y-2">
          {sent.map((n) => (
            <div key={n.id} className="rounded-md border border-border bg-muted/30 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                LoadLine · {audienceLabel(n.audience)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
