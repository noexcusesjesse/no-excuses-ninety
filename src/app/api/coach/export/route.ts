import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exportClientCSV } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/coach/export?clientId=xxx
 * Export a client's data as CSV.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  const csv = await exportClientCSV(clientId);
  if (!csv) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="client-${clientId}.csv"`,
    },
  });
}
