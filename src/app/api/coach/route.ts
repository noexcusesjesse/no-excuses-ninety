import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Retired. Client Coach tab is the assigned-coach 1:1 thread (`/client/coach`).
 * Do not leave an AI inbox competing with the human thread.
 */
export async function POST() {
  return NextResponse.json(
    { error: "AI coach chat was replaced by your assigned coach thread." },
    { status: 410 },
  );
}
