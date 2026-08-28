import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, schema, first } from "@/db/client";
import { and, eq } from "drizzle-orm";
import {
  getDayType,
  getDayTypeLabel,
  getTargetHours,
  getMaxHours,
  type FastingSettings,
  type FastType,
} from "@/lib/fast-cycle";
import { getProgramPosition, todayISODate } from "@/lib/program-position";

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

  const client = first(
    await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1),
  );
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const settings: FastingSettings = {
    anchorDay: client.anchorDay,
    treDays: JSON.parse(client.treDays || "[3,5]"),
    resetVariant: client.resetVariant as "standard_24hr" | "extended_36hr",
    physicianClearedExtendedFasts: client.physicianClearedExtendedFasts ?? false,
  };

  const todayISO = todayISODate();
  const today = new Date(`${todayISO}T12:00:00Z`);
  const position = getProgramPosition(client.startDate, todayISO);
  const { type, label, color } = getDayTypeLabel(today, settings, null, position);

  // Check for active fast today
  const activeFast = first(
    await db.select().from(schema.dailyCheckins)
      .where(and(
        eq(schema.dailyCheckins.clientId, clientId),
        eq(schema.dailyCheckins.date, todayISO),
      ))
      .limit(1),
  );

  const isActive = activeFast?.fastStartMs && !activeFast?.fastEndMs;

  return NextResponse.json({
    date: todayISO,
    fastType: type,
    label,
    color,
    targetHours: getTargetHours(type, settings, position),
    maxHours: getMaxHours(type, settings, position),
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

  const todayISO = todayISODate();

  // Find or create today's check-in
  const checkin = first(
    await db.select().from(schema.dailyCheckins)
      .where(and(
        eq(schema.dailyCheckins.clientId, clientId),
        eq(schema.dailyCheckins.date, todayISO),
      ))
      .limit(1),
  );

  const client = first(
    await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1),
  );
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const settings: FastingSettings = {
    anchorDay: client.anchorDay,
    treDays: JSON.parse(client.treDays || "[3,5]"),
    resetVariant: client.resetVariant as "standard_24hr" | "extended_36hr",
    physicianClearedExtendedFasts: client.physicianClearedExtendedFasts ?? false,
  };

  const today = new Date(`${todayISO}T12:00:00Z`);
  const position = getProgramPosition(client.startDate, todayISO);
  const fastType: FastType = getDayType(today, settings, null, position);

  if (action === "start") {
    const nowMs = Date.now();
    const nowDate = new Date(nowMs);
    if (checkin) {
      // Update existing check-in
      await db.update(schema.dailyCheckins)
        .set({
          fastType,
          fastStartMs: nowMs,
          fastEndMs: null,
          fastDurationMs: null,
          updatedAt: nowDate,
        })
        .where(eq(schema.dailyCheckins.id, checkin.id));
    } else {
      // Create new check-in with fast started
      await db.insert(schema.dailyCheckins).values({
        id: crypto.randomUUID(),
        clientId,
        date: todayISO,
        fastType,
        fastStartMs: nowMs,
        fastEndMs: null,
        fastDurationMs: null,
        createdAt: nowDate,
        updatedAt: nowDate,
      });
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
    await db.update(schema.dailyCheckins)
      .set({
        fastEndMs: nowMs,
        fastDurationMs: duration,
        updatedAt: nowDate,
      })
      .where(eq(schema.dailyCheckins.id, checkin.id));
    return NextResponse.json({ ok: true, action: "end", endMs: nowMs, durationMs: duration });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
