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
  // Try coaches table first
  const coach = db
    .select()
    .from(schema.coaches)
    .where(eq(schema.coaches.email, email.toLowerCase()))
    .get();
  if (coach && compareSync(password, coach.passwordHash)) {
    return { userId: coach.id, role: "coach", email: coach.email };
  }

  // Try clients table
  const client = db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.email, email.toLowerCase()))
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
 * Get the current session role, or null if not logged in.
 */
export async function getSessionRole(): Promise<"client" | "coach" | null> {
  const session = await getSession();
  return session.userId ? session.role : null;
}
