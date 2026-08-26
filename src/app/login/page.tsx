import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-12">
      <div className="w-full">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            No Excuses
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Ninety
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            const result = await loginAction(email, password);
            if (result.error) {
              // TODO: show error in UI — for now redirect to login with error
              // We can't easily pass error back without client component.
              // For a prototype, the inline server action handles it.
            }
          }}
          className="space-y-4"
        >
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
          Coach: coach@loadlinefitness.com / loadline-demo
          <br />
          Client: marcus@example.com / client-demo
        </p>
      </div>
    </main>
  );
}
