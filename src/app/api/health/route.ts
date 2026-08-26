import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Health check endpoint for Railway deployment.
 * Returns 200 if the app is running and the DB is reachable.
 */
export async function GET() {
  try {
    // Verify the DB is reachable by running a trivial query
    const { db, schema } = await import("@/db/client");
    const coachCount = db.select().from(schema.coaches).all().length;
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      db: "connected",
      coaches: coachCount,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
