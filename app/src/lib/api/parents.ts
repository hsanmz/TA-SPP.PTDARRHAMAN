import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import {
  parentStudents,
  parents,
  sessions,
  students,
  userRoles,
  users,
} from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";

export const listParents = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db
    .select({
      id: parents.id,
      user_id: parents.user_id,
      username: parents.username,
      full_name: parents.full_name,
      phone: parents.phone,
      email: parents.email,
      address: parents.address,
      deleted_at: parents.deleted_at,
      created_at: parents.created_at,
      user_is_active: users.is_active,
    })
    .from(parents)
    .leftJoin(users, eq(parents.user_id, users.id))
    .where(isNull(parents.deleted_at))
    .orderBy(parents.full_name)
    .all();
});

export const listParentStudents = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db.select().from(parentStudents).orderBy(parentStudents.id).all();
});

export const createParent = createServerFn({ method: "POST" })
  .validator(
    z.object({
      full_name: z.string().min(1).max(100),
      phone: z.string().min(1).max(30),
      email: z.string().max(120).nullable().optional(),
      address: z.string().max(255).nullable().optional(),
      username: z.string().max(30).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.insert(parents).values({
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      username: data.username?.trim().toLowerCase() || null,
    });
    void logAudit(user.id, "create_parent", "parent", undefined, { name: data.full_name });
    return { ok: true };
  });

export const addParentStudentLink = createServerFn({ method: "POST" })
  .validator(z.object({ parentId: z.string().min(1), studentId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const exists = await db
      .select()
      .from(parentStudents)
      .where(
        and(
          eq(parentStudents.parent_id, data.parentId),
          eq(parentStudents.student_id, data.studentId),
        ),
      )
      .get();
    if (exists) throw new Error("Hubungan sudah ada.");
    await db
      .insert(parentStudents)
      .values({ parent_id: data.parentId, student_id: data.studentId });
    void logAudit(user.id, "link_parent_student", "parent_student", undefined, {
      parent: data.parentId,
      student: data.studentId,
    });
    return { ok: true };
  });

export const removeParentStudentLink = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.delete(parentStudents).where(eq(parentStudents.id, data.id));
    void logAudit(user.id, "unlink_parent_student", "parent_student", data.id);
    return { ok: true };
  });

export const deleteParent = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    // Bersihkan keterhubungan santri secara eksplisit untuk menjaga integritas relasional
    await db.delete(parentStudents).where(eq(parentStudents.parent_id, data.id));
    await db.delete(parents).where(eq(parents.id, data.id));
    void logAudit(user.id, "delete_parent", "parent", data.id);
    return { ok: true };
  });

export const toggleParentUserActive = createServerFn({ method: "POST" })
  .validator(z.object({ parentId: z.string().min(1), active: z.boolean() }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const parent = await db.select().from(parents).where(eq(parents.id, data.parentId)).get();
    if (!parent) throw new Error("Data orang tua tidak ditemukan.");
    if (!parent.user_id) throw new Error("Wali ini belum memiliki akun login terhubung.");

    await db
      .update(users)
      .set({ is_active: data.active, updated_at: new Date() })
      .where(eq(users.id, parent.user_id));

    if (!data.active) {
      await db.delete(sessions).where(eq(sessions.user_id, parent.user_id));
    }

    void logAudit(
      user.id,
      data.active ? "activate_parent_user" : "deactivate_parent_user",
      "parent",
      data.parentId,
      { userId: parent.user_id, active: data.active },
    );
    return { ok: true, active: data.active };
  });

export const linkParentAccount = createServerFn({ method: "POST" })
  .validator(z.object({ parentId: z.string().min(1), username: z.string().min(1).max(30) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const username = data.username.trim().toLowerCase();
    const account = await db.select().from(users).where(eq(users.username, username)).get();
    if (!account) throw new Error("Username tidak ditemukan.");
    const parent = await db.select().from(parents).where(eq(parents.id, data.parentId)).get();
    if (!parent) throw new Error("Orang tua tidak ditemukan.");
    await db
      .update(parents)
      .set({ user_id: account.id, username })
      .where(eq(parents.id, data.parentId));

    const hasParentRole = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.user_id, account.id), eq(userRoles.role, "parent")))
      .get();
    if (!hasParentRole) {
      await db.insert(userRoles).values({ user_id: account.id, role: "parent" });
    }

    void logAudit(user.id, "link_parent_account", "parent", data.parentId, { username });
    return { ok: true, username: account.username };
  });
