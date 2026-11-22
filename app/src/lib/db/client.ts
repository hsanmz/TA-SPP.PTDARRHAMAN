import { createClient as createWebClient, type Client as WebClient } from "@libsql/client/web";
import { drizzle as drizzleWeb } from "drizzle-orm/libsql/web";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { schema } from "../../../drizzle/schema";
import { getServerEnv, type D1DatabaseLike } from "../storage";

type LibSqlClient = WebClient | { execute: (...args: unknown[]) => Promise<unknown> };
type D1DbInstance = ReturnType<typeof drizzleD1<typeof schema>>;
type LocalDbInstance = ReturnType<typeof drizzleWeb<typeof schema>>;

let client: LibSqlClient | D1DatabaseLike | undefined;
let _d1Db: D1DbInstance | undefined;
let _localDb: LocalDbInstance | undefined;

export function getD1Binding(): D1DatabaseLike | undefined {
  const env = getServerEnv();
  const g = globalThis as unknown as Record<string, unknown>;
  const envObj = g["__env__"] as Record<string, unknown> | undefined;
  return (env?.["DB"] ?? g["DB"] ?? envObj?.["DB"]) as D1DatabaseLike | undefined;
}

function resolveDatabaseUrl(): string {
  const url = process.env["DATABASE_URL"];
  if (url && !url.includes("turso.io")) {
    return url;
  }
  return "file:./data/ta-spp.db";
}

export function getClient(): LibSqlClient | D1DatabaseLike {
  const d1 = getD1Binding();
  if (d1 && typeof d1.prepare === "function") {
    return d1;
  }
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
  return client!;
}

export function getDb(): D1DbInstance | LocalDbInstance {
  const d1 = getD1Binding();
  if (d1 && typeof d1.prepare === "function") {
    if (!_d1Db || (_d1Db as unknown as { $client?: unknown }).$client !== d1) {
      _d1Db = drizzleD1(d1 as unknown as Parameters<typeof drizzleD1>[0], { schema });
    }
    return _d1Db;
  }

  if (!_localDb) {
    const url = resolveDatabaseUrl();
    if (url.startsWith("file:")) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { drizzle } = require("drizzle-orm/libsql");
        _localDb = drizzle(getClient() as WebClient, { schema });
      } catch {
        _localDb = drizzleWeb(getClient() as WebClient, { schema });
      }
    } else {
      _localDb = drizzleWeb(getClient() as WebClient, { schema });
    }
  }
  return _localDb!;
}

export const db = new Proxy({} as ReturnType<typeof drizzleWeb<typeof schema>>, {
  get(_, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Db = typeof db;
