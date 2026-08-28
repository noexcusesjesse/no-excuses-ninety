import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set it to a Postgres connection string (local or Railway).",
    );
  }
  return url;
}

const globalForPg = globalThis as unknown as {
  postgresSql: ReturnType<typeof postgres> | undefined;
};

/** Shared postgres.js pool. Cached in dev so Next.js HMR does not leak connections. */
export const sql =
  globalForPg.postgresSql ?? postgres(requireDatabaseUrl(), { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForPg.postgresSql = sql;
}

export const db = drizzle(sql, { schema });
export { schema };

export function first<T>(rows: T[]): T | undefined {
  return rows[0];
}
