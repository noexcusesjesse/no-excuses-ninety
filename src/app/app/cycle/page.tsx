import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Cycle was renamed to Month. Keep the old path working. */
export default function CycleRedirectPage() {
  redirect("/app/month");
}
