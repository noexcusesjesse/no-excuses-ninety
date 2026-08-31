import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTodayLogFormValues, upsertTodayLog } from "@/db/queries";
import { clientMayWriteLog, type DailyLogFormInput } from "@/lib/daily-log";

export const dynamic = "force-dynamic";

/**
 * GET /api/log
 * Today's check-in + weight for the signed-in client (empty fields if none).
 */
export async function GET() {
  const session = await getSession();
  if (!clientMayWriteLog(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = await getTodayLogFormValues();
  if (!values) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(values);
}

/**
 * POST /api/log
 * Upsert today's daily_checkins row (and weights when provided).
 * Client session only. Does not write fasting timer fields.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || !clientMayWriteLog(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: DailyLogFormInput;
  try {
    body = (await req.json()) as DailyLogFormInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await upsertTodayLog(session.userId, body);
  return NextResponse.json({ ok: true, date: result.date, checkinId: result.checkinId });
}
