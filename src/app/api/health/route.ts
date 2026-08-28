import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Health check endpoint for Railway deployment.
 * Returns 200 if the app is running and Postgres is reachable.
 */
export async function GET() {
  try {
    const { db, schema } = await import("@/db/client");
    const coaches = await db.select({ id: schema.coaches.id }).from(schema.coaches);
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      db: "connected",
      coaches: coaches.length,
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
