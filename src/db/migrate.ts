/**
 * Apply pending Drizzle migrations to the SQLite DB.
 * Run via: npm run db:migrate
 */
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

console.log("Running migrations…");
migrate(db, { migrationsFolder: "./drizzle" });
console.log("✓ Migrations applied");
