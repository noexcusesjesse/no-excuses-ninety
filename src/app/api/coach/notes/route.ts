import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addCoachNote } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * POST /api/coach/notes
 * Add a note for a client. Body: { clientId, note }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, note } = body;

  if (!clientId || !note?.trim()) {
    return NextResponse.json({ error: "Missing clientId or note" }, { status: 400 });
  }

  const ok = await addCoachNote(clientId, note.trim());
  if (!ok) {
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
