import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, inArray, isNotNull, isNull, like, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { invoices, payments, students } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";

export const listInvoices = createServerFn({ method: "POST" })
  .validator(
    z.object({
      type: z.enum(["all", "spp", "non_spp", "event"]).default("all"),
      status: z.enum(["all", "unpaid", "partial", "paid", "cancelled", "archived"]).default("all"),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(1000).default(20),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const typeFilter = data.type !== "all" ? data.type : null;
    const conds: SQL[] = [];
    if (data.status === "archived") {
      conds.push(isNotNull(invoices.deleted_at));
    } else {
      conds.push(isNull(invoices.deleted_at));
      if (data.status !== "all") {
        conds.push(eq(invoices.status, data.status));
      }
    }
    if (typeFilter) conds.push(eq(invoices.type, typeFilter));
    if (data.search?.trim()) {
      conds.push(like(invoices.title, `%${data.search.trim()}%`));
    }
    const conditions = and(...conds);
    const rows = await db
      .select()
      .from(invoices)
      .where(conditions)
      .orderBy(desc(invoices.created_at))
      .limit(data.pageSize)
      .offset((data.page - 1) * data.pageSize)
      .all();
    const total = await db
      .select({ n: sql<number>`count(*)` })
      .from(invoices)
      .where(conditions)
      .get();
    return { rows, total: total?.n ?? 0 };
  });

export const listInvoicePayments = createServerFn({ method: "POST" })
  .validator(z.object({ invoiceId: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    return db
      .select()
      .from(payments)
      .where(and(eq(payments.invoice_id, data.invoiceId), isNull(payments.deleted_at)))
      .orderBy(asc(payments.created_at))
      .all();
  });

export const createNonSppInvoice = createServerFn({ method: "POST" })
  .validator(
    z.object({
      student_id: z.string().min(1),
      title: z.string().min(1).max(200),
      description: z.string().max(500).nullable().optional(),
      amount: z.number().int().positive(),
      allow_installment: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const newInvoiceId = crypto.randomUUID();
    await db.insert(invoices).values({
      id: newInvoiceId,
      student_id: data.student_id,
      type: "non_spp",
      title: data.title.trim(),
      description: data.description?.trim() || null,
      amount: data.amount,
      allow_installment: data.allow_installment,
    });
    void logAudit(user.id, "create_invoice", "invoice", newInvoiceId, {
      title: data.title.trim(),
      amount: data.amount,
      type: "non_spp",
    });
    return { ok: true };
  });

export const archiveInvoice = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const paid = await db
      .select({ n: sql<number>`count(*)` })
      .from(payments)
      .where(and(eq(payments.invoice_id, data.id), eq(payments.status, "confirmed")))
      .get();
    if ((paid?.n ?? 0) > 0) throw new Error("Tagihan dengan pembayaran tidak bisa diarsipkan.");
    await db
      .update(invoices)
      .set({ deleted_at: new Date(), status: "cancelled" })
      .where(eq(invoices.id, data.id));
    void logAudit(user.id, "archive_invoice", "invoice", data.id);
    return { ok: true };
  });

export const listOpenInvoices = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db
    .select()
    .from(invoices)
    .where(and(inArray(invoices.status, ["unpaid", "partial"]), isNull(invoices.deleted_at)))
    .orderBy(desc(invoices.created_at))
    .all();
});

export const listEventInvoices = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.type, "event"))
    .orderBy(desc(invoices.created_at))
    .all();
});

export const detailStudentInvoices = createServerFn({ method: "POST" })
  .validator(z.object({ studentId: z.string().min(1), year: z.number().int().optional() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    return db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.student_id, data.studentId),
          isNull(invoices.deleted_at),
          data.year ? eq(invoices.period_year, data.year) : undefined,
        ),
      )
      .orderBy(desc(invoices.created_at))
      .all();
  });

export const listStudentsWithInvoice = createServerFn({ method: "GET" }).handler(
  async (): Promise<StudentRow[]> => {
    await requireAdmin();
    const rows = await db.select().from(invoices).where(eq(invoices.type, "spp")).all();
    const ids = [...new Set(rows.map((r) => r.student_id))];
    if (ids.length === 0) return [];
    const studs = await db
      .select({
        id: students.id,
        nis: students.nis,
        full_name: students.full_name,
        class_name: students.class_name,
        grade_level: students.grade_level,
        cohort: students.cohort,
        status: students.status,
        guardian_phone: students.guardian_phone,
      })
      .from(students)
      .where(and(inArray(students.id, ids), isNull(students.deleted_at)));
    return studs as unknown as StudentRow[];
  },
);

export type StudentRow = {
  id: string;
  nis: string;
  full_name: string;
  class_name: string | null;
  grade_level: number | null;
  cohort: string | null;
  status: "active" | "graduated" | "inactive";
  guardian_phone: string | null;
};
