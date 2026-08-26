import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DATABASE_PATH = process.env.DATABASE_PATH || resolve(process.cwd(), "data", "app.db");

const parentDir = dirname(DATABASE_PATH);
if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });

const sqlite = new Database(DATABASE_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
export const rawDb = sqlite;
