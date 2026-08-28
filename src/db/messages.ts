/**
 * In-app messaging — two channels only:
 *   1. Assigned coach ↔ client 1:1 (Staff is never a participant)
 *   2. Staff broadcasts, shown to recipients as LoadLine (program)
 */
import "server-only";
import { db, schema, first } from "./client";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import {
  LOADLINE_FROM,
  MAX_MESSAGE_CHARS,
  type BroadcastAudience,
  type ProgramNotice,
  type ThreadMessage,
  type ThreadSender,
} from "@/lib/message-types";

export {
  LOADLINE_FROM,
  MAX_MESSAGE_CHARS,
  audienceLabel,
  type BroadcastAudience,
  type ProgramNotice,
  type ThreadMessage,
  type ThreadSender,
} from "@/lib/message-types";

export interface AssignedThread {
  clientId: string;
  clientName: string;
  coachId: string;
  coachName: string;
  messages: ThreadMessage[];
  canSend: boolean;
}

function ts(value: Date | number | null | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return typeof value === "number" ? (value > 1e12 ? value : value * 1000) : 0;
}

function isSenderRole(value: string): value is ThreadSender {
  return value === "coach" || value === "client";
}

function isAudience(value: string): value is BroadcastAudience {
  return value === "all" || value === "clients" || value === "coaches";
}

function previewing(session: { staffReturn?: { userId: string } }): boolean {
  return !!session.staffReturn?.userId;
}

export async function getAssignedThread(clientId: string): Promise<AssignedThread | null> {
  const session = await getSession();
  if (!session.userId) return null;

  const client = first(await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1));
  if (!client) return null;

  if (session.role === "client" && session.userId !== clientId) return null;
  if (session.role === "coach" && session.userId !== client.coachId) return null;
  if (session.role === "staff") return null;

  const coach = first(await db.select().from(schema.coaches).where(eq(schema.coaches.id, client.coachId)).limit(1));
  if (!coach) return null;

  const rows = await db.select().from(schema.threadMessages)
    .where(and(
      eq(schema.threadMessages.coachId, client.coachId),
      eq(schema.threadMessages.clientId, clientId),
    ))
    .orderBy(schema.threadMessages.createdAt);

  const canSend =
    !previewing(session) &&
    ((session.role === "client" && session.userId === clientId) ||
      (session.role === "coach" && session.userId === client.coachId));

  return {
    clientId: client.id,
    clientName: client.name,
    coachId: coach.id,
    coachName: coach.name,
    messages: rows
      .filter((r) => isSenderRole(r.senderRole))
      .map((r) => ({
        id: r.id,
        senderRole: r.senderRole as ThreadSender,
        body: r.body,
        createdAt: ts(r.createdAt),
      })),
    canSend,
  };
}

export async function getClientOwnThread(): Promise<AssignedThread | null> {
  const session = await getSession();
  if (!session.userId || session.role !== "client") return null;
  return getAssignedThread(session.userId);
}

export async function sendThreadMessage(
  body: string,
  clientId?: string,
): Promise<{ ok: true; message: ThreadMessage } | { ok: false; error: string; status: number }> {
  const session = await getSession();
  if (!session.userId) return { ok: false, error: "Unauthorized", status: 401 };
  if (previewing(session)) {
    return { ok: false, error: "Preview cannot send. Exit preview to leave 1:1 threads untouched.", status: 403 };
  }
  if (session.role !== "client" && session.role !== "coach") {
    return { ok: false, error: "Only the assigned coach and client can send in this thread.", status: 403 };
  }

  const text = body.trim();
  if (!text) return { ok: false, error: "Message required", status: 400 };
  if (text.length > MAX_MESSAGE_CHARS) return { ok: false, error: "Message too long", status: 400 };

  const targetClientId = session.role === "client" ? session.userId : clientId;
  if (!targetClientId) return { ok: false, error: "Missing clientId", status: 400 };

  const client = first(await db.select().from(schema.clients).where(eq(schema.clients.id, targetClientId)).limit(1));
  if (!client) return { ok: false, error: "Client not found", status: 404 };

  if (session.role === "coach" && client.coachId !== session.userId) {
    return { ok: false, error: "Not the assigned coach for this client.", status: 403 };
  }

  const senderRole: ThreadSender = session.role;
  const id = randomUUID();
  await db.insert(schema.threadMessages).values({
    id,
    coachId: client.coachId,
    clientId: client.id,
    senderRole,
    body: text,
  });

  const row = first(await db.select().from(schema.threadMessages).where(eq(schema.threadMessages.id, id)).limit(1));
  return {
    ok: true,
    message: {
      id,
      senderRole,
      body: text,
      createdAt: ts(row?.createdAt) || Date.now(),
    },
  };
}

function audiencesFor(role: "client" | "coach"): BroadcastAudience[] {
  return role === "client" ? ["all", "clients"] : ["all", "coaches"];
}

export async function getProgramNotices(): Promise<ProgramNotice[]> {
  const session = await getSession();
  if (!session.userId || (session.role !== "client" && session.role !== "coach")) return [];
  const allowed = audiencesFor(session.role);
  const rows = await db.select().from(schema.broadcasts)
    .where(inArray(schema.broadcasts.audience, allowed))
    .orderBy(desc(schema.broadcasts.createdAt))
    .limit(50);
  return rows.map((r) => ({
    id: r.id,
    from: LOADLINE_FROM,
    body: r.body,
    createdAt: ts(r.createdAt),
    audience: isAudience(r.audience) ? r.audience : "all",
  }));
}

export async function getStaffBroadcasts(): Promise<ProgramNotice[]> {
  const session = await getSession();
  if (!session.userId || session.role !== "staff") return [];
  const rows = await db.select().from(schema.broadcasts)
    .orderBy(desc(schema.broadcasts.createdAt))
    .limit(50);
  return rows.map((r) => ({
    id: r.id,
    from: LOADLINE_FROM,
    body: r.body,
    createdAt: ts(r.createdAt),
    audience: isAudience(r.audience) ? r.audience : "all",
  }));
}

export async function sendBroadcast(
  audience: string,
  body: string,
): Promise<{ ok: true; notice: ProgramNotice } | { ok: false; error: string; status: number }> {
  const session = await getSession();
  if (!session.userId || session.role !== "staff") {
    return { ok: false, error: "Staff session required", status: 401 };
  }
  if (!isAudience(audience)) {
    return { ok: false, error: "Audience must be all, clients, or coaches", status: 400 };
  }
  const text = body.trim();
  if (!text) return { ok: false, error: "Message required", status: 400 };
  if (text.length > MAX_MESSAGE_CHARS) return { ok: false, error: "Message too long", status: 400 };

  const id = randomUUID();
  await db.insert(schema.broadcasts).values({
    id,
    staffId: session.userId,
    audience,
    body: text,
  });
  const row = first(await db.select().from(schema.broadcasts).where(eq(schema.broadcasts.id, id)).limit(1));
  return {
    ok: true,
    notice: {
      id,
      from: LOADLINE_FROM,
      body: text,
      createdAt: ts(row?.createdAt) || Date.now(),
      audience,
    },
  };
}
