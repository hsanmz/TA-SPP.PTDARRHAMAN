import { createClient as createWebClient, type Client as WebClient } from "@libsql/client/web";
import { drizzle as drizzleWeb } from "drizzle-orm/libsql/web";
import { schema } from "../../../drizzle/schema";

let client: WebClient | any;
let _db: ReturnType<typeof drizzleWeb<typeof schema>> | undefined;

function resolveDatabaseUrl(): string {
  return process.env["DATABASE_URL"] ?? "file:./data/ta-spp.db";
}

export function getClient(): any {
  if (!client) {
    const url = resolveDatabaseUrl();
    const authToken = process.env["DATABASE_AUTH_TOKEN"];
    if (url.startsWith("file:")) {
      try {
        // Native local sqlite client jika tersedia
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createClient } = require("@libsql/client");
        client = createClient({ url, authToken });
      } catch {
        client = createWebClient({ url, authToken });
      }
    } else {
      client = createWebClient({ url, authToken });
    }
  }
  return client;
}

function getDb(): ReturnType<typeof drizzleWeb<typeof schema>> {
  if (!_db) {
    const url = resolveDatabaseUrl();
    if (url.startsWith("file:")) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { drizzle } = require("drizzle-orm/libsql");
        _db = drizzle(getClient(), { schema });
      } catch {
        _db = drizzleWeb(getClient(), { schema });
      }
    } else {
      _db = drizzleWeb(getClient(), { schema });
    }
  }
  return _db!;
}

export const db = new Proxy({} as ReturnType<typeof drizzleWeb<typeof schema>>, {
  get(_, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Db = typeof db;
