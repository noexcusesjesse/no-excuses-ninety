import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db/client";
import { and, eq } from "drizzle-orm";
import {
  getDayType,
  getDayTypeLabel,
  getTargetHours,
  getMaxHours,
  type FastingSettings,
  type FastType,
} from "@/lib/fast-cycle";

export const dynamic = "force-dynamic";

/**
 * GET /api/fasting/today
 * Returns today's fasting type, target hours, and any active fast.
 */
export async function GET() {
  const session = await getSession();
  if (!session.userId || session.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clientId = session.userId;

  const client = db.select().from(schema.clients)
    .where(eq(schema.clients.id, clientId)).get();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const settings: FastingSettings = {
    anchorDay: client.anchorDay,
    treDays: JSON.parse(client.treDays || "[3,5]"),
    resetVariant: client.resetVariant as "standard_24hr" | "extended_36hr",
    physicianClearedExtendedFasts: client.physicianClearedExtendedFasts ?? false,
  };

  const today = new Date();
  const { type, label, color } = getDayTypeLabel(today, settings, null);

  // Check for active fast today
  const todayISO = today.toISOString().slice(0, 10);
  const activeFast = db.select().from(schema.dailyCheckins)
    .where(and(
      eq(schema.dailyCheckins.clientId, clientId),
      eq(schema.dailyCheckins.date, todayISO),
    ))
    .get();

  const isActive = activeFast?.fastStartMs && !activeFast?.fastEndMs;

  return NextResponse.json({
    date: todayISO,
    fastType: type,
    label,
    color,
    targetHours: getTargetHours(type, settings),
    maxHours: getMaxHours(type, settings),
    isActive: !!isActive,
    activeStartMs: activeFast?.fastStartMs ?? null,
    activeElapsedMs: isActive ? Date.now() - (activeFast?.fastStartMs ?? 0) : null,
    settings,
  });
}

/**
 * POST /api/fasting/today
 * Start or end a fast.
 * Body: { action: "start" | "end" }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clientId = session.userId;

  const body = await req.json();
  const { action } = body as { action: "start" | "end" };

  const todayISO = new Date().toISOString().slice(0, 10);

  // Find or create today's check-in
  const checkin = db.select().from(schema.dailyCheckins)
    .where(and(
      eq(schema.dailyCheckins.clientId, clientId),
      eq(schema.dailyCheckins.date, todayISO),
    ))
    .get();

  const client = db.select().from(schema.clients)
    .where(eq(schema.clients.id, clientId)).get();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const settings: FastingSettings = {
    anchorDay: client.anchorDay,
    treDays: JSON.parse(client.treDays || "[3,5]"),
    resetVariant: client.resetVariant as "standard_24hr" | "extended_36hr",
    physicianClearedExtendedFasts: client.physicianClearedExtendedFasts ?? false,
  };

  const today = new Date();
  const fastType: FastType = getDayType(today, settings, null);

  if (action === "start") {
    const nowMs = Date.now();
    const nowDate = new Date(nowMs);
    if (checkin) {
      // Update existing check-in
      db.update(schema.dailyCheckins)
        .set({
          fastType,
          fastStartMs: nowMs,
          fastEndMs: null,
          fastDurationMs: null,
          updatedAt: nowDate,
        })
        .where(eq(schema.dailyCheckins.id, checkin.id))
        .run();
    } else {
      // Create new check-in with fast started
      db.insert(schema.dailyCheckins).values({
        id: crypto.randomUUID(),
        clientId,
        date: todayISO,
        fastType,
        fastStartMs: nowMs,
        fastEndMs: null,
        fastDurationMs: null,
        createdAt: nowDate,
        updatedAt: nowDate,
      }).run();
    }
    return NextResponse.json({ ok: true, action: "start", startMs: nowMs });
  }

  if (action === "end") {
    if (!checkin?.fastStartMs) {
      return NextResponse.json({ error: "No active fast to end" }, { status: 400 });
    }
    const nowMs = Date.now();
    const nowDate = new Date(nowMs);
    const duration = nowMs - checkin.fastStartMs;
    db.update(schema.dailyCheckins)
      .set({
        fastEndMs: nowMs,
        fastDurationMs: duration,
        updatedAt: nowDate,
      })
      .where(eq(schema.dailyCheckins.id, checkin.id))
      .run();
    return NextResponse.json({ ok: true, action: "end", endMs: nowMs, durationMs: duration });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
