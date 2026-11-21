import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { expenses } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";

export const listExpenses = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db.select().from(expenses).orderBy(desc(expenses.spent_at)).all();
});

export const createExpense = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1).max(200),
      category: z.string().max(50).nullable().optional(),
      amount: z.number().int().positive(),
      spent_at: z.string(),
      note: z.string().max(500).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.insert(expenses).values({
      title: data.title.trim(),
      category: data.category?.trim() || null,
      amount: data.amount,
      spent_at: data.spent_at.slice(0, 10),
      note: data.note?.trim() || null,
    });
    void logAudit(user.id, "create_expense", "expense", undefined, {
      title: data.title,
      amount: data.amount,
    });
    return { ok: true };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.delete(expenses).where(eq(expenses.id, data.id));
    void logAudit(user.id, "delete_expense", "expense", data.id);
    return { ok: true };
  });
