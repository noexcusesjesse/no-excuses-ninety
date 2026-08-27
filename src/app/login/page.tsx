import { loginAction } from "../actions";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { housePath } from "@/lib/session-config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const session = await getSession();
  if (session.userId) redirect(housePath(session.role));

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            No Excuses
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Reset
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form action={loginAction} className="space-y-4">
          {searchParams?.error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Invalid email or password
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              autoComplete="email"
              className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              autoComplete="current-password"
              className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Staff: staff@loadlinefitness.com / staff-demo
          <br />
          Coach: coach@loadlinefitness.com / loadline-demo
          <br />
          Client: marcus@example.com / client-demo
        </p>
      </div>
    </main>
  );
}
