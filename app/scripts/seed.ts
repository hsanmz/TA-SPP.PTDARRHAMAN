import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle as drizzleWeb } from "drizzle-orm/libsql/web";
import { and, eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { hashPassword } from "../src/lib/backend/crypto";

const url = process.env.DATABASE_URL ?? "file:./data/ta-spp.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

type LibSqlClient = { close?: () => void };
type DrizzleDb = ReturnType<typeof drizzleWeb<typeof schema>>;

let client: LibSqlClient | undefined;
let db: DrizzleDb | undefined;

if (url.startsWith("file:")) {
  if (url.startsWith("file:.")) mkdirSync(dirname(resolve(url.slice(5))), { recursive: true });
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/libsql");
    client = createClient({ url, authToken });
    db = drizzle(client, { schema });
  } catch {
    client = createWebClient({ url, authToken });
    db = drizzleWeb(client, { schema });
  }
} else {
  client = createWebClient({ url, authToken });
  db = drizzleWeb(client, { schema });
}

async function upsertUser(
  username: string,
  password: string,
  fullName: string,
  role: "superadmin" | "admin",
) {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .get();
  let userId: string;
  if (existing) {
    await db
      .update(schema.users)
      .set({ password_hash: await hashPassword(password), is_active: true })
      .where(eq(schema.users.id, existing.id));
    userId = existing.id;
    console.log(`[seed] update akun ${username}`);
  } else {
    const inserted = await db
      .insert(schema.users)
      .values({ username, full_name: fullName, password_hash: await hashPassword(password) })
      .returning({ id: schema.users.id });
    userId = inserted[0].id!;
    console.log(`[seed] buat akun ${username}`);
  }
  const existingRole = await db
    .select()
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.user_id, userId), eq(schema.userRoles.role, role)))
    .get();
  if (!existingRole) {
    await db.insert(schema.userRoles).values({ user_id: userId, role });
    console.log(`[seed] pasang role ${role} untuk ${username}`);
  }
  return userId;
}

async function ensureSchoolSettings() {
  const row = await db
    .select()
    .from(schema.schoolSettings)
    .where(eq(schema.schoolSettings.id, 1))
    .get();
  if (!row) {
    await db.insert(schema.schoolSettings).values({
      id: 1,
      name: "Pesantren Darul Rahman",
      short_name: "DARAH",
      tagline: "Mendidik Generasi Qur'ani",
    });
    console.log("[seed] profil sekolah dibuat");
  }
}

await ensureSchoolSettings();
await upsertUser("superadmin", "SuperAdmin123!.", "Superadmin PTDARRAHMAN", "superadmin");
await upsertUser("admin", "Admin123!.", "Administrator PTDARRAHMAN", "admin");

console.log("[seed] selesai");
if (client?.close) client.close();
