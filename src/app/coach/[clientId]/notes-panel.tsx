"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NoteEntry {
  id: string;
  note: string;
  createdAt: number;
}

export function NotesPanel({ clientId, notes }: { clientId: string; notes: NoteEntry[] }) {
  const [noteText, setNoteText] = useState("");
  const [localNotes, setLocalNotes] = useState<NoteEntry[]>(notes);
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!noteText.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/coach/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, note: noteText.trim() }),
      });
      if (res.ok) {
        setLocalNotes((prev) => [
          { id: Date.now().toString(), note: noteText.trim(), createdAt: Date.now() },
          ...prev,
        ]);
        setNoteText("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Add a note…"
          className="flex h-10 flex-1 rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={saving}
        />
        <Button onClick={addNote} disabled={saving || !noteText.trim()}>
          Add
        </Button>
      </div>

      {localNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {localNotes.map((n) => (
            <div key={n.id} className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-sm">{n.note}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
