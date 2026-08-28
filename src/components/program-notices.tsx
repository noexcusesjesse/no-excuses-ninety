import { LOADLINE_FROM, type ProgramNotice } from "@/lib/message-types";

export function ProgramNotices({ notices }: { notices: ProgramNotice[] }) {
  if (notices.length === 0) {
    return <p className="text-sm text-muted-foreground">No program messages yet.</p>;
  }

  return (
    <div className="space-y-2">
      {notices.map((n) => (
        <div key={n.id} className="rounded-md border border-border bg-muted/30 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {LOADLINE_FROM} · program
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
