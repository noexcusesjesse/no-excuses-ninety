/**
 * Apply pending Drizzle migrations to Postgres.
 * Run via: npm run db:migrate
 * Requires DATABASE_URL.
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set it to a Postgres connection string (local or Railway).",
    );
  }

  const client = postgres(url, { max: 1 });
  try {
    console.log("Running migrations…");
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✓ Migrations applied");
  } finally {
    await client.end({ timeout: 5 });
  }
}

const invokedDirectly =
  process.argv[1]?.includes("migrate.ts") || process.argv[1]?.includes("migrate");

if (invokedDirectly) {
  runMigrations().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
