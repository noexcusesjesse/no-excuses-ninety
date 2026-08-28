"use server";

import { redirect } from "next/navigation";
import { getSession, authenticate } from "@/lib/auth";
import { housePath } from "@/lib/session-config";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const session = await getSession();
  const result = await authenticate(email, password);
  if (!result) {
    redirect("/login?error=1");
  }
  session.userId = result.userId;
  session.role = result.role;
  session.email = result.email;
  delete session.staffReturn;
  await session.save();
  redirect(housePath(result.role));
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
