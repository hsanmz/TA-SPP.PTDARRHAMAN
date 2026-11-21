import { getRequest } from "@tanstack/react-start/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, userRoles, users, type AppRole } from "../../../drizzle/schema";
import { randomToken, sha256Hex } from "./crypto";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  roles: AppRole[];
  role: AppRole | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken();
  await db.insert(sessions).values({
    user_id: userId,
    token_hash: await sha256Hex(token),
    expires_at: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token_hash, await sha256Hex(token)));
}

export async function resolveSession(token: string | null): Promise<AuthUser | null> {
  if (!token) return null;
  const row = await db
    .select({
      id: sessions.id,
      userId: sessions.user_id,
      expiresAt: sessions.expires_at,
    })
    .from(sessions)
    .where(eq(sessions.token_hash, await sha256Hex(token)))
    .get();
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.id));
    return null;
  }
  const user = await db.select().from(users).where(eq(users.id, row.userId)).get();
  if (!user || !user.is_active) return null;
  const roles = await db.select().from(userRoles).where(eq(userRoles.user_id, user.id)).all();
  return toAuthUser(
    user,
    roles.map((r) => r.role as AppRole),
  );
}

export function toAuthUser(user: typeof users.$inferSelect, roleList: AppRole[] = []): AuthUser {
  const sorted = [...roleList].sort();
  const role = sorted.includes("superadmin")
    ? ("superadmin" as const)
    : sorted.includes("admin")
      ? ("admin" as const)
      : sorted.includes("parent")
        ? ("parent" as const)
        : null;
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    phone: user.phone,
    email: user.email,
    roles: sorted,
    role,
    isAdmin: role === "admin" || role === "superadmin",
    isSuperadmin: role === "superadmin",
  };
}

export function getTokenFromRequest(): string | null {
  const request = getRequest();
  if (!request?.headers) return null;
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

async function requireUserInternal(required: AppRole[] | null): Promise<AuthUser> {
  const user = await resolveSession(getTokenFromRequest());
  if (!user) throw new Error("Unauthorized: sesi tidak valid atau sudah kedaluwarsa");
  if (required && required.length > 0 && (!user.role || !required.includes(user.role))) {
    throw new Error("Akses ditolak: Anda tidak memiliki izin.");
  }
  return user;
}

export function requireAuth(): Promise<AuthUser> {
  return requireUserInternal(null);
}

export function requireAdmin(): Promise<AuthUser> {
  return requireUserInternal(["admin", "superadmin"]);
}

export function requireSuperadmin(): Promise<AuthUser> {
  return requireUserInternal(["superadmin"]);
}

export function requireRoles(roles: AppRole[]): Promise<AuthUser> {
  return requireUserInternal(roles);
}

export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const roles = await db.select().from(userRoles).where(eq(userRoles.user_id, userId)).all();
  return roles.map((r) => r.role as AppRole);
}

export async function hasActiveSession(token: string | null): Promise<boolean> {
  if (!token) return false;
  const row = await db
    .select({ expiresAt: sessions.expires_at })
    .from(sessions)
    .where(
      and(eq(sessions.token_hash, await sha256Hex(token)), gt(sessions.expires_at, new Date())),
    )
    .get();
  return Boolean(row);
}
