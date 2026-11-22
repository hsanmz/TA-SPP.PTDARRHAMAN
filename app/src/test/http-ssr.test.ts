import { describe, it, expect, beforeAll } from "bun:test";

describe("HTTP ENDPOINT, SSR & ROUTING AUDIT", () => {
  let worker: {
    default: { fetch: (req: Request, env: unknown, ctx: unknown) => Promise<Response> };
  };
  const env = {
    CRON_SECRET: "CRON_TEST_SECRET_KEY_123",
    DATABASE_URL: "file:./data/test-audit.db",
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
  const ctx = {
    waitUntil: (p: Promise<unknown>) => p,
    passThroughOnException: () => {},
  };

  beforeAll(async () => {
    // Import compiled Nitro/Cloudflare worker entrypoint
    // @ts-expect-error untyped worker bundle
    worker = await import("../../.output/server/index.mjs");
    expect(worker.default).toBeDefined();
    expect(typeof worker.default.fetch).toBe("function");
  });

  describe("Public SSR Routes Rendering", () => {
    it("Renders public authentication page /auth with HTTP 200 and HTML content", async () => {
      const req = new Request("http://localhost/auth");
      const res = await worker.default.fetch(req, env, ctx);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
      const html = await res.text();
      expect(html).toContain("<!DOCTYPE html>");
      expect(html.length).toBeGreaterThan(1000);
    });

    it("Renders printable public receipt route /kuitansi/:receiptNumber with HTTP 200", async () => {
      const req = new Request("http://localhost/kuitansi/KWT-TEST-001");
      const res = await worker.default.fetch(req, env, ctx);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");
      const html = await res.text();
      expect(html).toContain("<!DOCTYPE html>");
    });
  });

  describe("CRON Automation API Security (/api/cron/generate-spp)", () => {
    it("Rejects non-POST HTTP methods with 405 Method Not Allowed", async () => {
      const getReq = new Request("http://localhost/api/cron/generate-spp", {
        method: "GET",
      });
      const res = await worker.default.fetch(getReq, env, ctx);
      expect(res.status).toBe(405);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toMatch(/Method Not Allowed/i);
    });

    it("Rejects unauthenticated POST requests with 401 Unauthorized", async () => {
      const postReq = new Request("http://localhost/api/cron/generate-spp", {
        method: "POST",
      });
      const res = await worker.default.fetch(postReq, env, ctx);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toMatch(/Unauthorized/i);
    });

    it("Rejects invalid month parameters with 400 Bad Request", async () => {
      const postReq = new Request("http://localhost/api/cron/generate-spp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CRON_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year: 2026, month: 15 }), // Invalid month
      });
      const res = await worker.default.fetch(postReq, env, ctx);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toMatch(/Bulan tidak valid/i);
    });

    it("Executes SPP generation for authorized POST request with 200 OK", async () => {
      const postReq = new Request("http://localhost/api/cron/generate-spp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CRON_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year: 2026, month: 9 }),
      });
      const res = await worker.default.fetch(postReq, env, ctx);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.year).toBe(2026);
      expect(json.month).toBe(9);
      expect(typeof json.generated).toBe("number");
    });
  });
});
