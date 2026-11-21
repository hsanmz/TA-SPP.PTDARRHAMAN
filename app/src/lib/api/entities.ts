import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { academicYears, bankAccounts, billCategories } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";

export const listBankAccounts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db.select().from(bankAccounts).orderBy(desc(bankAccounts.created_at)).all();
});

export const saveBankAccount = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      bank_name: z.string().min(1).max(60),
      account_number: z.string().min(1).max(40),
      account_holder: z.string().min(1).max(120),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const values = {
      bank_name: data.bank_name.trim(),
      account_number: data.account_number.trim(),
      account_holder: data.account_holder.trim(),
      is_active: data.is_active,
    };
    if (data.id) {
      await db.update(bankAccounts).set(values).where(eq(bankAccounts.id, data.id));
    } else {
      await db.insert(bankAccounts).values(values);
    }
    void logAudit(user.id, "update_bank_account", "bank_account", data.id);
    return { ok: true };
  });

export const deleteBankAccount = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.delete(bankAccounts).where(eq(bankAccounts.id, data.id));
    void logAudit(user.id, "delete_bank_account", "bank_account", data.id);
    return { ok: true };
  });

export const listAcademicYears = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db.select().from(academicYears).orderBy(desc(academicYears.created_at)).all();
});

export const saveAcademicYear = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1).max(40),
      start_date: z.string().nullable().optional(),
      end_date: z.string().nullable().optional(),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const values = {
      name: data.name.trim(),
      start_date: data.start_date?.trim() || null,
      end_date: data.end_date?.trim() || null,
      is_active: data.is_active,
    };
    if (data.id) {
      await db.update(academicYears).set(values).where(eq(academicYears.id, data.id));
    } else {
      const exists = await db
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(eq(academicYears.name, values.name))
        .get();
      if (exists) throw new Error("Nama tahun ajaran sudah dipakai.");
      await db.insert(academicYears).values(values);
    }
    void logAudit(user.id, "update_academic_year", "academic_year", data.id);
    return { ok: true };
  });

export const deleteAcademicYear = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.delete(academicYears).where(eq(academicYears.id, data.id));
    void logAudit(user.id, "delete_academic_year", "academic_year", data.id);
    return { ok: true };
  });

export const listBillCategories = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db.select().from(billCategories).orderBy(asc(billCategories.code)).all();
});

export const saveBillCategory = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      default_amount: z.number().int().positive().nullable().optional(),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const values = {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      default_amount: data.default_amount ?? null,
      is_active: data.is_active,
    };
    if (data.id) {
      await db.update(billCategories).set(values).where(eq(billCategories.id, data.id));
    } else {
      const exists = await db
        .select({ id: billCategories.id })
        .from(billCategories)
        .where(eq(billCategories.code, values.code))
        .get();
      if (exists) throw new Error("Kode kategori sudah dipakai.");
      await db.insert(billCategories).values(values);
    }
    void logAudit(user.id, "update_bill_category", "bill_category", data.id);
    return { ok: true };
  });

export const deleteBillCategory = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.delete(billCategories).where(eq(billCategories.id, data.id));
    void logAudit(user.id, "delete_bill_category", "bill_category", data.id);
    return { ok: true };
  });
