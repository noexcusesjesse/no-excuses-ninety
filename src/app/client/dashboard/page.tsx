import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Old /app/dashboard and /client/dashboard both land on the Client house home. */
export default function ClientDashboardRedirectPage() {
  redirect("/client");
}
