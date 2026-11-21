import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { events, expenses, invoices, payments, schoolSettings } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";

function ms(dateIso: string): number {
  return new Date(dateIso).getTime();
}

export const getReportData = createServerFn({ method: "POST" })
  .validator(z.object({ from: z.string(), to: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const [paymentsRows, invoiceRows, eventRows, expenseRows] = await Promise.all([
      db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.status, "confirmed"),
            isNull(payments.deleted_at),
            gte(payments.created_at, new Date(ms(data.from))),
            lt(payments.created_at, new Date(ms(data.to))),
          ),
        )
        .orderBy(desc(payments.created_at))
        .all(),
      db
        .select({
          id: invoices.id,
          type: invoices.type,
          event_id: invoices.event_id,
          title: invoices.title,
        })
        .from(invoices)
        .all(),
      db.select({ id: events.id, name: events.name }).from(events).all(),
      db
        .select()
        .from(expenses)
        .where(and(gte(expenses.spent_at, data.from), lt(expenses.spent_at, data.to)))
        .orderBy(desc(expenses.spent_at))
        .all(),
    ]);
    return {
      payments: paymentsRows,
      invoices: invoiceRows,
      events: eventRows,
      expenses: expenseRows,
    };
  });

export const updateSchoolProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1).max(200),
      short_name: z.string().min(1).max(60),
      address: z.string().max(255).nullable().optional(),
      phone: z.string().max(30).nullable().optional(),
      email: z.string().max(120).nullable().optional(),
      tagline: z.string().max(255).nullable().optional(),
      bank_name: z.string().max(50).nullable().optional(),
      bank_account_name: z.string().max(100).nullable().optional(),
      bank_account_number: z.string().max(30).nullable().optional(),
      qris_content: z.string().max(500).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.update(schoolSettings).set({
      name: data.name.trim(),
      short_name: data.short_name.trim(),
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      tagline: data.tagline?.trim() || null,
      bank_name: data.bank_name?.trim() || null,
      bank_account_name: data.bank_account_name?.trim() || null,
      bank_account_number: data.bank_account_number?.trim() || null,
      qris_content: data.qris_content?.trim() || null,
      updated_at: new Date(),
    });
    void logAudit(user.id, "update_school_profile", "school", "1");
    return { ok: true };
  });
