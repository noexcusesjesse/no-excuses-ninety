"use server";

import { redirect } from "next/navigation";
import { getSession, authenticate } from "@/lib/auth";

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const session = await getSession();
  const result = await authenticate(email, password);
  if (!result) {
    return { error: "Invalid email or password" };
  }
  session.userId = result.userId;
  session.role = result.role;
  session.email = result.email;
  await session.save();
  return { error: null };
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
