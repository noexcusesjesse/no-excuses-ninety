/**
 * Wipe the Postgres schema, re-run migrations, and seed demo data.
 * Run via: npm run db:reset
 * Requires DATABASE_URL. Never run this against production unless you mean to.
 */
import "dotenv/config";
import postgres from "postgres";
import { runMigrations } from "./migrate";
import { seedDatabase } from "./seed";

async function reset(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set it to a Postgres connection string (local or Railway).",
    );
  }

  console.log("Dropping public schema…");
  const client = postgres(url, { max: 1 });
  try {
    await client.unsafe("DROP SCHEMA IF EXISTS public CASCADE");
    await client.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE");
    await client.unsafe("CREATE SCHEMA public");
    await client.unsafe("GRANT ALL ON SCHEMA public TO public");
  } finally {
    await client.end({ timeout: 5 });
  }

  await runMigrations();
  await seedDatabase();
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
