import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/ta-spp.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
