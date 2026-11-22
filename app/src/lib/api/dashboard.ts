import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import {
  expenses,
  invoices,
  payments,
  parentStudents,
  parents,
  students,
} from "../../../drizzle/schema";
import { requireAdmin, requireAuth } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";
import { generateSppForPeriod } from "@/lib/backend/spp";

function ms(dateIso: string): number {
  return new Date(dateIso).getTime();
}

export const dashboardSummary = createServerFn({ method: "POST" })
  .validator(z.object({ from: z.string(), to: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const fromMs = ms(data.from);
    const toMs = ms(data.to);

    const [studentCount, outstanding, paymentRows, expenseRows, pendingRows] = await Promise.all([
      db
        .select({ n: sql<number>`count(*)` })
        .from(students)
        .where(and(eq(students.status, "active"), isNull(students.deleted_at)))
        .get(),
      db
        .select({
          total: sql<number>`coalesce(sum(${invoices.amount} - ${invoices.paid_amount}), 0)`,
        })
        .from(invoices)
        .where(and(isNull(invoices.deleted_at), inArray(invoices.status, ["unpaid", "partial"])))
        .get(),
      db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.status, "confirmed"),
            isNull(payments.deleted_at),
            gte(payments.created_at, new Date(fromMs)),
            lt(payments.created_at, new Date(toMs)),
          ),
        )
        .all(),
      db
        .select({ amount: expenses.amount })
        .from(expenses)
        .where(and(gte(expenses.spent_at, data.from), lt(expenses.spent_at, data.to)))
        .all(),
      db
        .select({ n: sql<number>`count(*)` })
        .from(payments)
        .where(and(eq(payments.status, "pending"), isNull(payments.deleted_at)))
        .get(),
    ]);

    let masuk = 0;
    let qris = 0;
    let offline = 0;
    let infaq = 0;
    for (const p of paymentRows) {
      const sum = p.amount + p.infaq_amount;
      masuk += sum;
      if (p.method === "qris") qris += sum;
      else offline += sum;
      infaq += p.infaq_amount;
    }

    return {
      students: studentCount?.n ?? 0,
      outstanding: outstanding?.total ?? 0,
      masuk,
      qris,
      offline,
      infaq,
      keluar: expenseRows.reduce((s, e) => s + e.amount, 0),
      pending: pendingRows?.n ?? 0,
    };
  });

export const monthlyTrend = createServerFn({ method: "POST" })
  .validator(z.object({ months: z.number().int().min(1).max(24).default(6) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (data.months - 1), 1);
    const rows = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, "confirmed"),
          isNull(payments.deleted_at),
          gte(payments.created_at, start),
        ),
      )
      .all();
    const byMonth = new Map<string, { total: number; qris: number; offline: number }>();
    for (let i = 0; i < data.months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      byMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, {
        total: 0,
        qris: 0,
        offline: 0,
      });
    }
    for (const p of rows) {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = byMonth.get(key);
      if (!entry) continue;
      const sum = p.amount + p.infaq_amount;
      entry.total += sum;
      if (p.method === "qris") entry.qris += sum;
      else entry.offline += sum;
    }
    return [...byMonth.entries()].map(([month, v]) => ({ month, ...v }));
  });

export const generateSppInvoices = createServerFn({ method: "POST" })
  .validator(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const created = await generateSppForPeriod(data.year, data.month);
    void logAudit(user.id, "generate_spp", "invoice", undefined, {
      year: data.year,
      month: data.month,
      count: created,
    });
    return created;
  });

export const parentDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireAuth();
  if (user.isAdmin) return { students: [], invoices: [] };
  const parent = await db
    .select()
    .from(parents)
    .where(and(eq(parents.user_id, user.id), isNull(parents.deleted_at)))
    .get();
  if (!parent) return { students: [], invoices: [] };
  const links = await db
    .select({ studentId: parentStudents.student_id })
    .from(parentStudents)
    .where(eq(parentStudents.parent_id, parent.id))
    .all();
  const ids = links.map((l) => l.studentId);
  if (ids.length === 0) return { students: [], invoices: [] };
  const [studentRows, invoiceRows] = await Promise.all([
    db
      .select({
        id: students.id,
        nis: students.nis,
        full_name: students.full_name,
        class_name: students.class_name,
      })
      .from(students)
      .where(and(inArray(students.id, ids), isNull(students.deleted_at)))
      .all(),
    db
      .select()
      .from(invoices)
      .where(and(inArray(invoices.student_id, ids), isNull(invoices.deleted_at)))
      .orderBy(desc(invoices.created_at))
      .all(),
  ]);
  return { students: studentRows, invoices: invoiceRows };
});
