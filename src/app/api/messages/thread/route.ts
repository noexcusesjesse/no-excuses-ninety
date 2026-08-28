import { NextRequest, NextResponse } from "next/server";
import { sendThreadMessage } from "@/db/messages";

export const dynamic = "force-dynamic";

/**
 * POST /api/messages/thread
 * Body: { body: string, clientId?: string }
 * Client: session user is the client. Coach: must pass clientId and be assigned.
 * Staff cannot send. Preview (staffReturn) cannot send.
 */
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  const body = typeof payload?.body === "string" ? payload.body : "";
  const clientId = typeof payload?.clientId === "string" ? payload.clientId : undefined;
  const result = await sendThreadMessage(body, clientId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, message: result.message });
}
