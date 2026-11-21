import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNull, like, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { invoices, parents, parentStudents, payments, schoolSettings, students } from "../../../drizzle/schema";
import { requireAdmin, requireAuth } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";
import { buildReceiptNumber, recalcInvoice } from "./money";
import { persistProof } from "@/lib/storage";

export const listPayments = createServerFn({ method: "POST" })
  .validator(
    z.object({
      admin: z.boolean().default(true),
      status: z.enum(["pending", "confirmed", "rejected", "voided"]).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(15),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAuth();
    if (data.admin && !user.isAdmin) throw new Error("Hanya admin.");
    const conds: SQL[] = [isNull(payments.deleted_at)];
    if (data.admin) {
      if (data.status) conds.push(eq(payments.status, data.status));
    } else {
      conds.push(eq(payments.paid_by, user.id));
    }
    if (data.search?.trim()) {
      conds.push(like(payments.receipt_number, `%${data.search.trim()}%`));
    }
    const conditions = and(...conds);
    const rows = await db
      .select()
      .from(payments)
      .where(conditions)
      .orderBy(desc(payments.created_at))
      .limit(data.pageSize)
      .offset((data.page - 1) * data.pageSize)
      .all();
    const totalRes = await db
      .select({ n: sql<number>`count(*)` })
      .from(payments)
      .where(conditions)
      .get();
    return { rows, total: totalRes?.n ?? 0 };
  });

async function getInvoiceOrThrow(invoiceId: string) {
  const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
  if (!invoice || invoice.deleted_at) throw new Error("Tagihan tidak ditemukan.");
  return invoice;
}

export const submitPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      invoice_id: z.string().min(1),
      amount: z.number().int().min(0),
      infaq_amount: z.number().int().min(0).default(0),
      method: z.enum(["offline", "qris"]),
      note: z.string().max(500).nullable().optional(),
      proof_url: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAuth();
    const invoice = await getInvoiceOrThrow(data.invoice_id);

    // Verifikasi kepemilikan tagihan untuk role non-admin (wali santri)
    if (!user.isAdmin) {
      const parent = await db
        .select({ id: parents.id })
        .from(parents)
        .where(and(eq(parents.user_id, user.id), isNull(parents.deleted_at)))
        .get();
      if (!parent) {
        throw new Error("Akses ditolak: Data wali murid tidak ditemukan.");
      }
      const link = await db
        .select({ id: parentStudents.id })
        .from(parentStudents)
        .where(
          and(
            eq(parentStudents.parent_id, parent.id),
            eq(parentStudents.student_id, invoice.student_id),
          ),
        )
        .get();
      if (!link) {
        throw new Error("Akses ditolak: Anda tidak memiliki akses ke tagihan santri ini.");
      }
    }

    if (data.amount <= 0 && data.infaq_amount <= 0) {
      throw new Error("Nominal pembayaran atau infaq harus lebih dari 0.");
    }

    if (invoice.status === "paid" || invoice.status === "cancelled")
      throw new Error("Tagihan sudah lunas/dibatalkan.");
    const sisa = invoice.amount - invoice.paid_amount;
    if (!invoice.allow_installment && data.amount > 0 && data.amount !== sisa) {
      throw new Error("Tagihan ini tidak mengizinkan cicilan. Pembayaran harus lunas sekaligus.");
    }
    if (data.amount > sisa) throw new Error("Nominal melebihi sisa tagihan.");
    const savedProofUrl = await persistProof(data.proof_url);
    await db.insert(payments).values({
      invoice_id: invoice.id,
      student_id: invoice.student_id,
      amount: data.amount,
      infaq_amount: data.infaq_amount,
      method: data.method,
      status: "pending",
      note: data.note?.trim() || null,
      proof_url: savedProofUrl,
      paid_by: user.id,
    });
    void logAudit(user.id, "submit_payment", "payment", invoice.id, {
      amount: data.amount,
      infaq: data.infaq_amount,
    });
    return { ok: true };
  });

export const recordPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      invoice_id: z.string().min(1),
      amount: z.number().int().min(0),
      infaq_amount: z.number().int().min(0).default(0),
      method: z.enum(["offline", "qris"]),
      note: z.string().max(500).nullable().optional(),
      proof_url: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const invoice = await getInvoiceOrThrow(data.invoice_id);
    if (data.amount <= 0 && data.infaq_amount <= 0) {
      throw new Error("Nominal pembayaran atau infaq harus lebih dari 0.");
    }
    if (invoice.status === "cancelled") throw new Error("Tagihan dibatalkan.");
    const sisa = invoice.amount - invoice.paid_amount;
    if (!invoice.allow_installment && data.amount > 0 && data.amount !== sisa) {
      throw new Error("Tagihan ini tidak mengizinkan cicilan. Pembayaran harus lunas sekaligus.");
    }
    if (data.amount > sisa) throw new Error("Nominal melebihi sisa tagihan.");
    const savedProofUrl = await persistProof(data.proof_url);
    await db.insert(payments).values({
      invoice_id: invoice.id,
      student_id: invoice.student_id,
      amount: data.amount,
      infaq_amount: data.infaq_amount,
      method: data.method,
      status: "confirmed",
      note: data.note?.trim() || null,
      proof_url: savedProofUrl,
      paid_by: user.id,
      confirmed_by: user.id,
      confirmed_at: new Date(),
      receipt_number: buildReceiptNumber(),
    });
    await recalcInvoice(invoice.id);
    void logAudit(user.id, "record_payment", "payment", invoice.id, { amount: data.amount });
    return { ok: true };
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .validator(z.object({ paymentId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const payment = await db.select().from(payments).where(eq(payments.id, data.paymentId)).get();
    if (!payment) throw new Error("Pembayaran tidak ditemukan.");
    if (payment.status !== "pending")
      throw new Error("Hanya pembayaran menunggu yang bisa dikonfirmasi.");
    if (!payment.invoice_id) throw new Error("Pembayaran tanpa tagihan.");
    const invoice = await getInvoiceOrThrow(payment.invoice_id);
    const sisa = invoice.amount - invoice.paid_amount;
    if (payment.amount > sisa) throw new Error("Nominal melebihi sisa tagihan.");
    await db
      .update(payments)
      .set({
        status: "confirmed",
        confirmed_at: new Date(),
        confirmed_by: user.id,
        receipt_number: buildReceiptNumber(),
      })
      .where(eq(payments.id, payment.id));
    await recalcInvoice(invoice.id);
    void logAudit(user.id, "confirm_payment", "payment", payment.id);
    return { ok: true };
  });

export const rejectPayment = createServerFn({ method: "POST" })
  .validator(z.object({ paymentId: z.string().min(1), reason: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db
      .update(payments)
      .set({
        status: "rejected",
        rejected_at: new Date(),
        rejected_by: user.id,
        reject_reason: data.reason,
      })
      .where(eq(payments.id, data.paymentId));
    void logAudit(user.id, "reject_payment", "payment", data.paymentId, { reason: data.reason });
    return { ok: true };
  });

export const voidPayment = createServerFn({ method: "POST" })
  .validator(z.object({ paymentId: z.string().min(1), reason: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const payment = await db.select().from(payments).where(eq(payments.id, data.paymentId)).get();
    if (!payment || !payment.invoice_id) throw new Error("Pembayaran tidak ditemukan.");
    if (payment.status !== "confirmed")
      throw new Error("Hanya pembayaran terkonfirmasi yang bisa dibatalkan.");
    await db
      .update(payments)
      .set({
        status: "voided",
        voided_at: new Date(),
        voided_by: user.id,
        void_reason: data.reason,
      })
      .where(eq(payments.id, payment.id));
    await recalcInvoice(payment.invoice_id);
    void logAudit(user.id, "void_payment", "payment", payment.id, { reason: data.reason });
    return { ok: true };
  });

export const getReceipt = createServerFn({ method: "POST" })
  .validator(z.object({ receiptNumber: z.string().min(1) }))
  .handler(async ({ data }) => {
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.receipt_number, data.receiptNumber))
      .get();
    if (!payment || payment.status !== "confirmed") return null;
    const invoice = payment.invoice_id
      ? await db.select().from(invoices).where(eq(invoices.id, payment.invoice_id)).get()
      : null;
    const student = payment.student_id
      ? await db.select().from(students).where(eq(students.id, payment.student_id)).get()
      : null;
    return {
      receipt_number: payment.receipt_number,
      amount: payment.amount,
      infaq_amount: payment.infaq_amount,
      method: payment.method,
      created_at: payment.created_at,
      note: payment.note,
      student_name: student?.full_name ?? null,
      student_nis: student?.nis ?? null,
      invoice_title: invoice?.title ?? null,
    };
  });

export const getSchoolProfile = createServerFn({ method: "GET" }).handler(async () => {
  const row = await db.select().from(schoolSettings).where(eq(schoolSettings.id, 1)).get();
  if (!row) return null;
  return {
    name: row.name,
    short_name: row.short_name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    tagline: row.tagline,
    bank_name: row.bank_name,
    bank_account_name: row.bank_account_name,
    bank_account_number: row.bank_account_number,
    qris_content: row.qris_content,
  };
});
