"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema, first } from "@/db/client";
import { getSession } from "@/lib/auth";
import { housePath } from "@/lib/session-config";
import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session-config";

async function requireStaffOrigin(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const isOrigin = session.role === "staff" || !!session.staffReturn?.userId;
  if (!isOrigin) redirect(housePath(session.role));
  if (session.role === "staff") {
    session.staffReturn = { userId: session.userId, email: session.email };
  }
  return session;
}

/** Open the existing Client house as that client. Not a Staff-skinned client UI. */
export async function openAsClientAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const session = await requireStaffOrigin();
  const client = first(await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1));
  if (!client) redirect("/staff");
  session.userId = client.id;
  session.role = "client";
  session.email = client.email;
  await session.save();
  redirect(housePath("client"));
}

/** Open the existing Coach roster as that coach. */
export async function openAsCoachAction(formData: FormData) {
  const coachId = String(formData.get("coachId") ?? "");
  const session = await requireStaffOrigin();
  const coach = first(await db.select().from(schema.coaches).where(eq(schema.coaches.id, coachId)).limit(1));
  if (!coach) redirect("/staff");
  session.userId = coach.id;
  session.role = "coach";
  session.email = coach.email;
  await session.save();
  redirect(housePath("coach"));
}

/** Restore Staff house after a client/coach preview. */
export async function exitPreviewAction() {
  const session = await getSession();
  if (!session.staffReturn?.userId) {
    if (!session.userId) redirect("/login");
    redirect(housePath(session.role));
  }
  session.userId = session.staffReturn.userId;
  session.role = "staff";
  session.email = session.staffReturn.email;
  delete session.staffReturn;
  await session.save();
  redirect("/staff");
}
