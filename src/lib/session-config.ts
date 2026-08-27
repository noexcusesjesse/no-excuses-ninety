import type { SessionOptions } from "iron-session";

/**
 * Session types + config — safe for Edge Runtime (middleware).
 * DB-dependent auth functions are in @/lib/auth.ts (Node only).
 */

export interface SessionData {
  userId: string;
  role: "client" | "coach";
  email: string;
}

/** Where a signed-in user lives. Client never sees Staff. Coach lands on /coach. */
export function housePath(role: SessionData["role"]): string {
  return role === "coach" ? "/coach" : "/app/dashboard";
}

const sessionPassword =
  process.env.SESSION_SECRET ||
  "dev-insecure-session-secret-replace-in-production-32chars";

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "nen-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};
