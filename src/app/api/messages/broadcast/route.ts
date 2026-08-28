import { NextRequest, NextResponse } from "next/server";
import { sendBroadcast } from "@/db/messages";

export const dynamic = "force-dynamic";

/**
 * POST /api/messages/broadcast
 * Body: { audience: "all" | "clients" | "coaches", body: string }
 * Staff only. Recipients see this as LoadLine, not Staff.
 */
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  const audience = typeof payload?.audience === "string" ? payload.audience : "";
  const body = typeof payload?.body === "string" ? payload.body : "";
  const result = await sendBroadcast(audience, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, notice: result.notice });
}
