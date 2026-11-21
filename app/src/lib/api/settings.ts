import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { sppSettings } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";
import { academicYearLabel } from "@/lib/semester";

export const listSppSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db.select().from(sppSettings).orderBy(desc(sppSettings.created_at)).all();
});

export const createSppSetting = createServerFn({ method: "POST" })
  .validator(
    z.object({
      amount: z.number().int().positive(),
      scope: z.enum(["all", "class", "grade"]),
      class_name: z.string().max(50).nullable().optional(),
      grade_level: z.number().int().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.insert(sppSettings).values({
      academic_year: academicYearLabel(),
      amount: data.amount,
      class_name: data.scope === "class" ? data.class_name?.trim() || null : null,
      grade_level: data.scope === "grade" ? (data.grade_level ?? null) : null,
      active: true,
    });
    void logAudit(user.id, "create_spp_setting", "spp_setting", undefined, { amount: data.amount });
    return { ok: true };
  });

export const toggleSppSetting = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1), active: z.boolean() }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.update(sppSettings).set({ active: data.active }).where(eq(sppSettings.id, data.id));
    void logAudit(
      user.id,
      data.active ? "activate_spp_setting" : "deactivate_spp_setting",
      "spp_setting",
      data.id,
    );
    return { ok: true };
  });

export const deleteSppSetting = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    await db.delete(sppSettings).where(eq(sppSettings.id, data.id));
    void logAudit(user.id, "delete_spp_setting", "spp_setting", data.id);
    return { ok: true };
  });
