import { describe, it, expect, beforeAll } from "bun:test";
import { hashPassword, verifyPassword, randomToken, sha256Hex } from "../lib/backend/crypto";
import {
  createSession,
  resolveSession,
  destroySession,
  toAuthUser,
  SESSION_TTL_MS,
} from "../lib/backend/auth";
import { db } from "../lib/db/client";
import { users, sessions, userRoles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("UNIT & CRYPTO AUTHENTICATION AUDIT", () => {
  describe("Cryptographic Hashing & Verification (PBKDF2-SHA256)", () => {
    it("generates formatted hash with 100,000 iterations and 16-byte salt", async () => {
      const password = "SuperSecretPassword2026!";
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      const parts = hashed.split("$");
      expect(parts.length).toBe(4);
      expect(parts[0]).toBe("pbkdf2");
      expect(parts[1]).toBe("100000");
      expect(parts[2]?.length).toBeGreaterThan(15);
      expect(parts[3]?.length).toBeGreaterThan(20);
    });

    it("generates distinct salts on consecutive hash calls for identical passwords", async () => {
      const password = "IdenticalPassword";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      const salt1 = hash1.split("$")[2];
      const salt2 = hash2.split("$")[2];
      expect(salt1).not.toBe(salt2);
    });

    it("verifies correct password successfully", async () => {
      const password = "CorrectHorseBatteryStaple";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password", async () => {
      const password = "CorrectPassword";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword("WrongPassword", hashed);
      expect(isValid).toBe(false);
    });

    it("rejects malformed hash strings gracefully without throwing", async () => {
      expect(await verifyPassword("test", "")).toBe(false);
      expect(await verifyPassword("test", "md5$abc$def")).toBe(false);
      expect(await verifyPassword("test", "pbkdf2$invalid$salt$hash")).toBe(false);
      expect(await verifyPassword("test", "pbkdf2$-10$salt$hash")).toBe(false);
    });
  });

  describe("Token & Digest Operations", () => {
    it("sha256Hex produces standard 64-char lowercase hex digest matching test vector", async () => {
      const knownInput = "hello";
      const expectedDigest = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
      const actualDigest = await sha256Hex(knownInput);
      expect(actualDigest).toBe(expectedDigest);
      expect(actualDigest.length).toBe(64);
    });

    it("randomToken produces cryptographically random alphanumeric tokens", () => {
      const token1 = randomToken();
      const token2 = randomToken();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(32);
      expect(/^[A-Za-z0-9]+$/.test(token1)).toBe(true);
    });
  });

  describe("Session Lifecycle & Role Resolution", () => {
    let testUserId: string;

    beforeAll(async () => {
      const user = await db.select().from(users).where(eq(users.username, "superadmin")).get();
      expect(user).toBeDefined();
      testUserId = user!.id;
    });

    it("creates a session and stores SHA-256 token hash", async () => {
      const rawToken = await createSession(testUserId);
      expect(rawToken).toBeDefined();

      const expectedHash = await sha256Hex(rawToken);
      const sessionRow = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token_hash, expectedHash))
        .get();

      expect(sessionRow).toBeDefined();
      expect(sessionRow?.user_id).toBe(testUserId);
      expect(sessionRow?.expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it("resolves active session to authenticated user with roles and permissions", async () => {
      const rawToken = await createSession(testUserId);
      const authUser = await resolveSession(rawToken);

      expect(authUser).not.toBeNull();
      expect(authUser?.id).toBe(testUserId);
      expect(authUser?.username).toBe("superadmin");
      expect(authUser?.isSuperadmin).toBe(true);
      expect(authUser?.isAdmin).toBe(true);
      expect(authUser?.role).toBe("superadmin");
    });

    it("destroys session and prevents subsequent resolution", async () => {
      const rawToken = await createSession(testUserId);
      expect(await resolveSession(rawToken)).not.toBeNull();

      await destroySession(rawToken);
      expect(await resolveSession(rawToken)).toBeNull();
    });

    it("automatically cleans up and rejects expired session", async () => {
      const rawToken = randomToken();
      const tokenHash = await sha256Hex(rawToken);

      // Insert expired session record (1 hour in the past)
      await db.insert(sessions).values({
        user_id: testUserId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() - 3600 * 1000),
      });

      const resolved = await resolveSession(rawToken);
      expect(resolved).toBeNull();

      // Verify that expired session was deleted from database
      const row = await db.select().from(sessions).where(eq(sessions.token_hash, tokenHash)).get();
      expect(row).toBeUndefined();
    });

    it("toAuthUser maps role hierarchy correctly (superadmin > admin > parent)", () => {
      const mockUser = {
        id: "usr-1",
        username: "test",
        full_name: "Test User",
        phone: null,
        email: null,
        password_hash: "hash",
        is_active: true,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const superUser = toAuthUser(mockUser, ["parent", "superadmin"]);
      expect(superUser.role).toBe("superadmin");
      expect(superUser.isSuperadmin).toBe(true);
      expect(superUser.isAdmin).toBe(true);

      const adminUser = toAuthUser(mockUser, ["parent", "admin"]);
      expect(adminUser.role).toBe("admin");
      expect(adminUser.isSuperadmin).toBe(false);
      expect(adminUser.isAdmin).toBe(true);

      const parentUser = toAuthUser(mockUser, ["parent"]);
      expect(parentUser.role).toBe("parent");
      expect(parentUser.isSuperadmin).toBe(false);
      expect(parentUser.isAdmin).toBe(false);
    });
  });
});
