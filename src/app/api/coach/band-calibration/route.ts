import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addBandCalibration, type BandCalibrationEntry } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * POST /api/coach/band-calibration
 * Add band calibration entries for a client. Body: { clientId, entries: BandCalibrationEntry[] }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, entries } = body as { clientId: string; entries: BandCalibrationEntry[] };

  if (!clientId || !entries?.length) {
    return NextResponse.json({ error: "Missing clientId or entries" }, { status: 400 });
  }

  const ok = await addBandCalibration(clientId, entries);
  if (!ok) {
    return NextResponse.json({ error: "Failed to add calibration" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
