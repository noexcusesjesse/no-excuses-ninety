import Link from "next/link";
import { Logo } from "./logo";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export async function AppHeader({ role }: { role: "client" | "coach" | "staff" }) {
  const session = await getSession();
  const isLoggedIn = !!session.userId;
  const currentRole = session.role;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size="sm" />
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              No Excuses
            </span>
            <span className="text-sm font-semibold tracking-tight">
              {role === "client" ? "LoadLine 30" : "LoadLine"}
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {isLoggedIn && currentRole === "client" && (
            <Link
              href="/client"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                role === "client"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Client
            </Link>
          )}
          {isLoggedIn && currentRole === "coach" && (
            <Link
              href="/coach"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                role === "coach"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Coach
            </Link>
          )}
          {isLoggedIn && currentRole === "staff" && (
            <Link
              href="/staff"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                role === "staff"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Staff
            </Link>
          )}
          {isLoggedIn ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
