import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { compareSync } from "bcryptjs";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { sessionOptions, type SessionData } from "./session-config";

export type { SessionData } from "./session-config";
export { sessionOptions } from "./session-config";

/**
 * Get the current session (server-side only — requires cookies()).
 */
export async function getSession() {
  const session = await getIronSession<SessionData>(
    cookies(),
    sessionOptions,
  );
  return session;
}

/**
 * Validate email + password against the DB.
 * Returns the session data if valid, null if not.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<SessionData | null> {
  const normalized = email.toLowerCase();

  const staff = db
    .select()
    .from(schema.staffs)
    .where(eq(schema.staffs.email, normalized))
    .get();
  if (staff && compareSync(password, staff.passwordHash)) {
    return { userId: staff.id, role: "staff", email: staff.email };
  }

  const coach = db
    .select()
    .from(schema.coaches)
    .where(eq(schema.coaches.email, normalized))
    .get();
  if (coach && compareSync(password, coach.passwordHash)) {
    return { userId: coach.id, role: "coach", email: coach.email };
  }

  const client = db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.email, normalized))
    .get();
  if (client && compareSync(password, client.passwordHash)) {
    return { userId: client.id, role: "client", email: client.email };
  }

  return null;
}

/**
 * Require a client session. Returns the clientId or throws.
 */
export async function requireClient(): Promise<string> {
  const session = await getSession();
  if (!session.userId || session.role !== "client") {
    throw new Error("Unauthorized: client session required");
  }
  return session.userId;
}

/**
 * Require a coach session. Returns the coachId or throws.
 */
export async function requireCoach(): Promise<string> {
  const session = await getSession();
  if (!session.userId || session.role !== "coach") {
    throw new Error("Unauthorized: coach session required");
  }
  return session.userId;
}

/**
 * Require a staff session. Returns the staffId or throws.
 * Impersonation (staffReturn set, role client/coach) does not count.
 */
export async function requireStaff(): Promise<string> {
  const session = await getSession();
  if (!session.userId || session.role !== "staff") {
    throw new Error("Unauthorized: staff session required");
  }
  return session.userId;
}

/**
 * True when the current session is Staff, or Staff previewing a client/coach.
 */
export async function isStaffOrigin(): Promise<boolean> {
  const session = await getSession();
  if (!session.userId) return false;
  return session.role === "staff" || !!session.staffReturn?.userId;
}

/**
 * Get the current session role, or null if not logged in.
 */
export async function getSessionRole(): Promise<SessionData["role"] | null> {
  const session = await getSession();
  return session.userId ? session.role : null;
}
