import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { students } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";

export const studentPayload = z.object({
  id: z.string().optional(),
  nis: z.string().min(1).max(30),
  full_name: z.string().min(1).max(100),
  gender: z.string().max(1).nullable().optional(),
  class_name: z.string().max(50).nullable().optional(),
  grade_level: z.number().int().nullable().optional(),
  cohort: z.string().max(30).nullable().optional(),
  status: z.enum(["active", "graduated", "inactive"]),
  guardian_phone: z.string().max(30).nullable().optional(),
});

export const listStudents = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db
    .select()
    .from(students)
    .where(isNull(students.deleted_at))
    .orderBy(students.full_name)
    .all();
});

export const getStudent = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const row = await db
      .select()
      .from(students)
      .where(and(eq(students.id, data.id), isNull(students.deleted_at)))
      .get();
    if (!row) throw new Error("Siswa tidak ditemukan.");
    return row;
  });

export const listStudentsMin = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db
    .select({
      id: students.id,
      nis: students.nis,
      full_name: students.full_name,
      class_name: students.class_name,
      status: students.status,
    })
    .from(students)
    .where(isNull(students.deleted_at))
    .orderBy(students.full_name)
    .all();
});

export const saveStudent = createServerFn({ method: "POST" })
  .validator(studentPayload)
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const values = {
      nis: data.nis.trim(),
      full_name: data.full_name.trim(),
      gender: data.gender || null,
      class_name: data.class_name || null,
      grade_level: data.grade_level ?? null,
      cohort: data.cohort || null,
      status: data.status,
      guardian_phone: data.guardian_phone || null,
    };
    if (data.id) {
      const exists = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(eq(students.nis, values.nis), ne(students.id, data.id), isNull(students.deleted_at)),
        )
        .get();
      if (exists) throw new Error("NIS sudah dipakai siswa lain.");
      await db.update(students).set(values).where(eq(students.id, data.id));
      void logAudit(user.id, "update_student", "student", data.id, {
        nis: values.nis,
        name: values.full_name,
      });
    } else {
      const exists = await db.select().from(students).where(eq(students.nis, values.nis)).get();
      if (exists) throw new Error("NIS sudah dipakai.");
      const studentId = crypto.randomUUID();
      await db.insert(students).values({ id: studentId, ...values });
      void logAudit(user.id, "create_student", "student", studentId, {
        nis: values.nis,
        name: values.full_name,
      });
    }
    return { ok: true };
  });

export const archiveStudent = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db
      .update(students)
      .set({ deleted_at: new Date(), status: "inactive" })
      .where(eq(students.id, data.id));
    void logAudit(user.id, "archive_student", "student", data.id);
    return { ok: true };
  });

export const importStudents = createServerFn({ method: "POST" })
  .validator(z.array(studentPayload))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    let imported = 0;
    for (const row of data) {
      const against = { ...row };
      const existing = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.nis, against.nis))
        .get();
      if (existing) {
        await db.update(students).set(against).where(eq(students.id, existing.id));
      } else {
        await db.insert(students).values(against);
      }
      imported += 1;
    }
    void logAudit(user.id, "import_students", "student", null, { count: imported });
    return { imported };
  });
