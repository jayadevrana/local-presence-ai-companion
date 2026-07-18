import "server-only";

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/db/schema";

const configuredDataDir = process.env.APP_DATA_DIR?.trim();
const dataDir = resolve(/*turbopackIgnore: true*/ process.cwd(), configuredDataDir || "local-data");
mkdirSync(dataDir, { recursive: true });

export const dbPath = resolve(dataDir, "companion.sqlite");
export const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
