import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { parents, sessions, userRoles, users } from "../../drizzle/schema";
import {
  createSession,
  destroySession,
  getTokenFromRequest,
  requireAdmin,
  requireAuth,
  requireSuperadmin,
  resolveSession,
  toAuthUser,
  type AuthUser,
} from "@/lib/backend/auth";
import { hashPassword, verifyPassword } from "@/lib/backend/crypto";
import { logAudit } from "@/lib/backend/audit";
import type { AppRole } from "../../drizzle/schema";

export type { AuthUser } from "@/lib/backend/auth";

const USERNAME_RE = /^[a-z0-9][a-z0-9._]{2,29}$/;
export const toAuthEmail = (username: string) => `${username.toLowerCase()}@local.app`;

const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(USERNAME_RE, "Username 3-30 karakter: huruf kecil, angka, titik (.), underscore (_)");

const userPayload = z.object({
  username: usernameSchema,
  full_name: z.string().min(1).max(100),
  password: z.string().min(6).max(72),
});

export interface SessionResult {
  user: AuthUser;
  token: string;
}

async function usernameTaken(username: string): Promise<boolean> {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .get();
  return Boolean(row);
}

async function assignRoles(userId: string, roles: AppRole[]): Promise<void> {
  await db.insert(userRoles).values(roles.map((role) => ({ user_id: userId, role })));
}

async function linkParentAccount(userId: string, username: string): Promise<void> {
  const parent = await db
    .select({ id: parents.id })
    .from(parents)
    .where(and(eq(parents.username, username), isNull(parents.user_id)))
    .get();
  if (parent) {
    await db.update(parents).set({ user_id: userId }).where(eq(parents.id, parent.id));
  }
}

async function existingStaffCount(): Promise<number> {
  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(inArray(userRoles.role, ["admin", "superadmin"]))
    .all();
  return rows.length;
}

export const login = createServerFn({ method: "POST" })
  .validator(z.object({ username: usernameSchema, password: z.string().min(1) }))
  .handler(async ({ data }): Promise<SessionResult> => {
    const username = data.username.toLowerCase();
    const user = await db.select().from(users).where(eq(users.username, username)).get();
    if (!user) throw new Error("Username tidak ditemukan.");
    if (!user.is_active) throw new Error("Akun dinonaktifkan. Hubungi administrator.");
    const ok = await verifyPassword(data.password, user.password_hash);
    if (!ok) throw new Error("Kata sandi salah.");
    const roleRows = await db.select().from(userRoles).where(eq(userRoles.user_id, user.id)).all();
    const roles = roleRows.map((r) => r.role as AppRole);
    await db.update(users).set({ last_login_at: new Date() }).where(eq(users.id, user.id));
    const token = await createSession(user.id);
    void logAudit(user.id, "login");
    return { user: toAuthUser(user, roles), token };
  });

export const signUpParent = createServerFn({ method: "POST" })
  .validator(userPayload)
  .handler(async ({ data }): Promise<SessionResult> => {
    const username = data.username.toLowerCase();
    if (await usernameTaken(username)) throw new Error("Username sudah dipakai.");
    const isFirstStaff = (await existingStaffCount()) === 0;
    const inserted = await db
      .insert(users)
      .values({
        username,
        full_name: data.full_name,
        password_hash: await hashPassword(data.password),
        email: toAuthEmail(username),
      })
      .returning();
    const newUser = inserted[0];
    if (!newUser) throw new Error("Gagal membuat akun.");
    const userId = newUser.id;
    await assignRoles(userId, isFirstStaff ? ["superadmin"] : ["parent"]);
    await linkParentAccount(userId, username);
    const token = await createSession(userId);
    void logAudit(userId, "signup", "user", userId, {
      role: isFirstStaff ? "superadmin" : "parent",
    });
    return { user: toAuthUser(newUser, isFirstStaff ? ["superadmin"] : ["parent"]), token };
  });

export const me = createServerFn({ method: "GET" }).handler(async (): Promise<AuthUser | null> => {
  return resolveSession(getTokenFromRequest());
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getTokenFromRequest();
  if (token) {
    const user = await resolveSession(token);
    if (user) void logAudit(user.id, "logout");
    await destroySession(token);
  }
  return { ok: true };
});

export const changePassword = createServerFn({ method: "POST" })
  .validator(
    z.object({ current_password: z.string().min(1), new_password: z.string().min(6).max(72) }),
  )
  .handler(async ({ data }) => {
    const user = await requireAuth();
    const row = await db.select().from(users).where(eq(users.id, user.id)).get();
    if (!row) throw new Error("Akun tidak ditemukan.");
    const ok = await verifyPassword(data.current_password, row.password_hash);
    if (!ok) throw new Error("Kata sandi saat ini salah.");
    if (data.new_password === data.current_password)
      throw new Error("Kata sandi baru harus berbeda dari yang lama.");
    await db
      .update(users)
      .set({ password_hash: await hashPassword(data.new_password), updated_at: new Date() })
      .where(eq(users.id, user.id));
    await db.delete(sessions).where(eq(sessions.user_id, user.id));
    void logAudit(user.id, "change_password");
    return { ok: true };
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .validator(userPayload)
  .handler(async ({ data }) => {
    const user = await requireSuperadmin();
    const username = data.username.toLowerCase();
    if (await usernameTaken(username)) throw new Error("Username sudah dipakai.");
    const inserted = await db
      .insert(users)
      .values({
        username,
        full_name: data.full_name,
        password_hash: await hashPassword(data.password),
      })
      .returning();
    const newUser = inserted[0];
    if (!newUser) throw new Error("Gagal membuat akun.");
    const userId = newUser.id;
    await assignRoles(userId, ["admin"]);
    await linkParentAccount(userId, username);
    void logAudit(user.id, "create_admin_user", "user", userId, { username });
    return { ok: true, userId };
  });

export const removeAdminUser = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireSuperadmin();
    if (data.userId === user.id) throw new Error("Tidak bisa mencabut akses diri sendiri.");
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.user_id, data.userId), eq(userRoles.role, "admin")));
    void logAudit(user.id, "remove_admin_role", "user", data.userId);
    return { ok: true };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().min(1), password: z.string().min(6).max(72) }))
  .handler(async ({ data }) => {
    const user = await requireSuperadmin();
    if (data.userId === user.id)
      throw new Error("Gunakan menu ganti kata sandi di profil Anda sendiri.");
    await db
      .update(users)
      .set({ password_hash: await hashPassword(data.password), updated_at: new Date() })
      .where(eq(users.id, data.userId));
    void logAudit(user.id, "reset_password", "user", data.userId);
    return { ok: true };
  });

export const toggleStaffActive = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().min(1), active: z.boolean() }))
  .handler(async ({ data }) => {
    const user = await requireSuperadmin();
    if (data.userId === user.id) throw new Error("Tidak dapat menonaktifkan akun sendiri.");
    await db
      .update(users)
      .set({ is_active: data.active, updated_at: new Date() })
      .where(eq(users.id, data.userId));
    if (!data.active) {
      await db.delete(sessions).where(eq(sessions.user_id, data.userId));
    }
    void logAudit(
      user.id,
      data.active ? "activate_staff" : "deactivate_staff",
      "user",
      data.userId,
      { active: data.active },
    );
    return { ok: true, active: data.active };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      full_name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      old_password: z.string().optional(),
      new_password: z.string().min(6).max(72).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAuth();
    const row = await db.select().from(users).where(eq(users.id, user.id)).get();
    if (!row) throw new Error("Akun tidak ditemukan.");

    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (data.full_name) {
      updates["full_name"] = data.full_name.trim();
    }
    if (data.email) {
      updates["email"] = data.email.trim();
    }
    if (data.phone) {
      updates["phone"] = data.phone.trim();
    }
    if (data.new_password) {
      if (!data.old_password) {
        throw new Error("Password lama wajib diisi untuk mengganti password.");
      }
      const ok = await verifyPassword(data.old_password, row.password_hash);
      if (!ok) {
        throw new Error("Password lama salah.");
      }
      updates["password_hash"] = await hashPassword(data.new_password);
    }

    await db.update(users).set(updates).where(eq(users.id, user.id));
    void logAudit(user.id, "update_profile", "user", user.id);
    return { ok: true };
  });
