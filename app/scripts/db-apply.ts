import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle as drizzleWeb } from "drizzle-orm/libsql/web";
import { migrate as migrateWeb } from "drizzle-orm/libsql/web/migrator";
import * as schema from "../drizzle/schema";

const url = process.env.DATABASE_URL ?? "file:./data/ta-spp.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

type LibSqlClient = { close?: () => void };
type DrizzleDb = ReturnType<typeof drizzleWeb<typeof schema>>;
type MigrateFunction = (db: DrizzleDb, config: { migrationsFolder: string }) => Promise<void>;

let client: LibSqlClient | undefined;
let db: DrizzleDb | undefined;
let migrateFn: MigrateFunction | undefined;

if (url.startsWith("file:")) {
  if (url.startsWith("file:.")) mkdirSync(dirname(resolve(url.slice(5))), { recursive: true });
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/libsql");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { migrate } = require("drizzle-orm/libsql/migrator");
    client = createClient({ url, authToken });
    db = drizzle(client, { schema });
    migrateFn = migrate;
  } catch {
    client = createWebClient({ url, authToken });
    db = drizzleWeb(client, { schema });
    migrateFn = migrateWeb;
  }
} else {
  client = createWebClient({ url, authToken });
  db = drizzleWeb(client, { schema });
  migrateFn = migrateWeb;
}

await migrateFn(db, { migrationsFolder: "./drizzle/migrations" });
console.log("[db] migrations applied successfully to:", url);
if (client?.close) client.close();
