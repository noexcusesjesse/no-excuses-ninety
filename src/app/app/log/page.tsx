import { getClientToday, getClientProfile } from "@/db/queries";
import { getMealTheme } from "@/lib/meal-themes";
import { LogForm } from "./log-form";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const client = await getClientToday();
  const profile = await getClientProfile();
  if (!client || !profile) return <div className="py-12 text-center text-muted-foreground">Not signed in as a client.</div>;

  const theme = getMealTheme(client.programDay - 1);

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {client.plan.dayLabel} · Day {client.programDay} of 90
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Daily Log</h1>
        <p className="mt-2 text-sm text-muted-foreground">Fast single-screen entry. Log what you actually did.</p>
      </div>

      {/* Meal theme banner */}
      <div className="mb-6 flex items-center gap-2">
        <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-primary">
          {theme.name}
        </span>
        <span className="text-xs text-muted-foreground">{theme.description}</span>
      </div>

      <LogForm theme={theme} />
    </>
  );
}
