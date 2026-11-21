import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invoices, payments } from "../../../drizzle/schema";

export async function recalcInvoice(invoiceId: string): Promise<void> {
  const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
  if (!invoice) throw new Error("Tagihan tidak ditemukan.");

  const row = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(sql`${payments.invoice_id} = ${invoiceId} and ${payments.status} = 'confirmed'`)
    .get();
  const paid = row?.total ?? 0;
  const status = paid <= 0 ? "unpaid" : paid >= invoice.amount ? "paid" : "partial";
  await db.update(invoices).set({ paid_amount: paid, status }).where(eq(invoices.id, invoiceId));
}

export function buildReceiptNumber(): string {
  const d = new Date();
  const ymd = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `KWT-${ymd}-${rand}`;
}
