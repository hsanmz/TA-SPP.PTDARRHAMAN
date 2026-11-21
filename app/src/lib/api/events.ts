import { createServerFn } from "@tanstack/react-start";
import { desc, eq, isNull, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { events, invoices, students } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";
import { logAudit } from "@/lib/backend/audit";

export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return db
    .select()
    .from(events)
    .where(isNull(events.deleted_at))
    .orderBy(desc(events.created_at))
    .all();
});

function addMonths(date: string, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const createEvent = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(500).nullable().optional(),
      total_amount: z.number().int().positive(),
      deadline: z.string().nullable().optional(),
      target: z.enum(["all", "class"]),
      class_name: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin();
    const targets = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.status, "active"),
          isNull(students.deleted_at),
          data.target === "all" ? undefined : eq(students.class_name, data.class_name ?? ""),
        ),
      )
      .all();
    if (targets.length === 0) throw new Error("Tidak ada siswa yang jadi target");
    const grace = data.deadline ? addMonths(data.deadline, 3) : null;
    return db.transaction(async (tx) => {
      const inserted = await tx
        .insert(events)
        .values({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          total_amount: data.total_amount,
          deadline: data.deadline || null,
          allow_installment: true,
          grace_months: 3,
        })
        .returning();
      const eventRow = inserted[0];
      if (!eventRow) throw new Error("Gagal membuat event.");
      const eventId = eventRow.id;
      await tx
        .insert(invoices)
        .values(
          targets.map((s) => ({
            student_id: s.id,
            type: "event" as const,
            title: data.name.trim(),
            event_id: eventId,
            amount: data.total_amount,
            allow_installment: true,
            grace_until: grace,
            due_date: data.deadline || null,
          })),
        )
        .onConflictDoNothing();
      void logAudit(user.id, "create_event", "event", eventId, {
        name: data.name,
        count: targets.length,
      });
      return { count: targets.length, eventId };
    });
  });
