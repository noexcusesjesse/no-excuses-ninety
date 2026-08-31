import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * POST /api/coach/clients
 * Create a new client. startDate is LoadLine 30 Day 1.
 * Body: { name, email, startDate, startWeightLb, heightIn?, dateOfBirth?, physicianClearedExtendedFasts? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, startDate, startWeightLb, heightIn, dateOfBirth, physicianClearedExtendedFasts } = body;

  if (!name || !email || !startDate || !startWeightLb) {
    return NextResponse.json({ error: "Missing required fields: name, email, startDate, startWeightLb" }, { status: 400 });
  }

  const clientId = await createClient({
    name, email, startDate, startWeightLb,
    heightIn, dateOfBirth, physicianClearedExtendedFasts,
  });

  if (!clientId) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clientId });
}
