import { getSession } from "@/lib/auth";
import { exitPreviewAction } from "@/app/staff/actions";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

/**
 * Shown only while Staff is previewing a client or coach house.
 * Not Client chrome: no Staff nav, no Staff links in AppHeader.
 * Label is "Exit preview" so a real client login never sees this (staffReturn unset).
 */
export async function PreviewBanner() {
  const session = await getSession();
  if (!session.staffReturn?.userId) return null;

  let name = session.email;
  if (session.role === "client") {
    name = db.select().from(schema.clients).where(eq(schema.clients.id, session.userId)).get()?.name ?? name;
  } else if (session.role === "coach") {
    name = db.select().from(schema.coaches).where(eq(schema.coaches.id, session.userId)).get()?.name ?? name;
  }

  const roleLabel = session.role === "coach" ? "coach" : "client";

  return (
    <div className="border-b border-warning/40 bg-warning/15 px-4 py-2 text-center text-sm text-foreground">
      Previewing as <span className="font-medium">{name}</span>
      <span className="text-muted-foreground"> · {roleLabel}</span>
      <form action={exitPreviewAction} className="ml-3 inline">
        <button type="submit" className="font-medium text-foreground underline underline-offset-2">
          Exit preview
        </button>
      </form>
    </div>
  );
}
