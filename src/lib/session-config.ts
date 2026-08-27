import type { SessionOptions } from "iron-session";

/**
 * Session types + config — safe for Edge Runtime (middleware).
 * DB-dependent auth functions are in @/lib/auth.ts (Node only).
 */

export type SessionRole = "client" | "coach" | "staff";

export interface SessionData {
  userId: string;
  role: SessionRole;
  email: string;
  /**
   * When Staff opens a client or coach view on purpose, the session becomes
   * that role so Client/Coach UI is unchanged (no Staff chrome). This holds
   * Jesse's staff identity so Exit preview can restore /staff.
   */
  staffReturn?: {
    userId: string;
    email: string;
  };
}

/** Where a signed-in user lives. Client never sees Staff; Coach roster is unchanged. */
export function housePath(role: SessionData["role"]): string {
  if (role === "staff") return "/staff";
  if (role === "coach") return "/coach";
  return "/app/dashboard";
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
