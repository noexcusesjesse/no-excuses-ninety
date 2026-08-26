import { AppHeader } from "@/components/app-header";
import { BottomTabNav } from "@/components/bottom-tab-nav";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "client") redirect("/");

  return (
    <>
      <AppHeader role="client" />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        {children}
      </main>
      <BottomTabNav />
    </>
  );
}
