import { AppHeader } from "@/components/app-header";
import { getSession } from "@/lib/auth";
import { housePath } from "@/lib/session-config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "staff") redirect(housePath(session.role));

  return (
    <>
      <AppHeader role="staff" />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        {children}
      </main>
    </>
  );
}
