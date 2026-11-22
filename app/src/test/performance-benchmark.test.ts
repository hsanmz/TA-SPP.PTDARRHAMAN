import { describe, it, expect } from "bun:test";
import { db } from "../lib/db/client";
import { users, students, invoices, sppSettings } from "../../drizzle/schema";
import { resolveSession, createSession } from "../lib/backend/auth";
import { hashPassword, verifyPassword } from "../lib/backend/crypto";
import { eq } from "drizzle-orm";

describe("PHASE 7 — PERFORMANCE, SCALABILITY & CONCURRENCY BENCHMARK", () => {
  it("Measures PBKDF2 password hashing & verification latency", async () => {
    const t0 = performance.now();
    const hash = await hashPassword("BenchPassword123!");
    const t1 = performance.now();
    const hashDuration = t1 - t0;

    const t2 = performance.now();
    const verified = await verifyPassword("BenchPassword123!", hash);
    const t3 = performance.now();
    const verifyDuration = t3 - t2;

    expect(verified).toBe(true);
    expect(hashDuration).toBeLessThan(500); // Expect < 500ms
    expect(verifyDuration).toBeLessThan(500);

    console.log(
      `[PERF:PBKDF2] Hash: ${hashDuration.toFixed(2)}ms, Verify: ${verifyDuration.toFixed(2)}ms`,
    );
  });

  it("Measures database query throughput & P95 latency across concurrent read operations", async () => {
    const admin = await db.select().from(users).where(eq(users.username, "admin")).get();
    expect(admin).toBeDefined();

    const iterations = 50;
    const latencies: number[] = [];

    // Concurrent burst of 50 queries
    const promises = Array.from({ length: iterations }, async () => {
      const start = performance.now();
      const user = await db.select().from(users).where(eq(users.username, "admin")).get();
      const end = performance.now();
      expect(user).toBeDefined();
      return end - start;
    });

    const results = await Promise.all(promises);
    latencies.push(...results);
    latencies.sort((a, b) => a - b);

    const sum = latencies.reduce((acc, v) => acc + v, 0);
    const avg = sum / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;

    console.log(
      `[PERF:DB-READS] 50 concurrent queries: Avg=${avg.toFixed(2)}ms, P50=${p50.toFixed(2)}ms, P95=${p95.toFixed(2)}ms, P99=${p99.toFixed(2)}ms`,
    );

    // Realistic threshold accounting for WSL2 /mnt/c filesystem lock contention
    expect(avg).toBeLessThan(500);
    expect(p95).toBeLessThan(750);
  });

  it("Measures session creation and resolution under concurrent load", async () => {
    const admin = await db.select().from(users).where(eq(users.username, "admin")).get();
    expect(admin).toBeDefined();
    const userId = admin!.id;

    const concurrency = 25;
    const t0 = performance.now();

    const tokens = await Promise.all(
      Array.from({ length: concurrency }, () => createSession(userId)),
    );

    const t1 = performance.now();
    const creationTime = t1 - t0;

    expect(tokens.length).toBe(concurrency);

    const resolveStart = performance.now();
    const authUsers = await Promise.all(tokens.map((tok) => resolveSession(tok)));
    const resolveEnd = performance.now();
    const resolutionTime = resolveEnd - resolveStart;

    for (const au of authUsers) {
      expect(au).toBeDefined();
      expect(au!.username).toBe("admin");
      expect(au!.isAdmin).toBe(true);
    }

    console.log(
      `[PERF:SESSION] 25 concurrent: Create Total=${creationTime.toFixed(2)}ms (${(creationTime / concurrency).toFixed(2)}ms/op), Resolve Total=${resolutionTime.toFixed(2)}ms (${(resolutionTime / concurrency).toFixed(2)}ms/op)`,
    );

    expect(creationTime / concurrency).toBeLessThan(100);
    expect(resolutionTime / concurrency).toBeLessThan(100);
  });
});
