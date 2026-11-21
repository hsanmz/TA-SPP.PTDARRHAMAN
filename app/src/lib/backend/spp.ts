import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invoices, sppSettings, students } from "../../../drizzle/schema";
import { BULAN } from "@/lib/format";
import { academicYearLabel } from "@/lib/semester";

export async function generateSppForPeriod(year: number, month: number): Promise<number> {
  const yearLabel = academicYearLabel();
  const activeStudents = await db
    .select()
    .from(students)
    .where(and(eq(students.status, "active"), isNull(students.deleted_at)))
    .all();
  if (activeStudents.length === 0) return 0;

  const allSettings = await db.select().from(sppSettings).where(eq(sppSettings.active, true)).all();
  if (allSettings.length === 0)
    throw new Error("Belum ada nominal SPP aktif. Atur dulu di menu Pengaturan.");
  const settings = allSettings.filter((s) => s.academic_year === yearLabel);
  const pool = settings.length > 0 ? settings : allSettings;

  const amountFor = (s: (typeof activeStudents)[number]): number | null => {
    const cls = pool.filter((p) => p.class_name);
    const match = cls.find((p) => p.class_name === s.class_name);
    if (match) return match.amount;
    const grd = pool.filter((p) => p.grade_level !== null && p.class_name === null);
    const matchGrade = grd.find((p) => p.grade_level === s.grade_level);
    if (matchGrade) return matchGrade.amount;
    const general = pool.find((p) => p.class_name === null && p.grade_level === null);
    return general?.amount ?? null;
  };

  const title = `SPP ${BULAN[month - 1]} ${year}`;
  let created = 0;
  await db.transaction(async (tx) => {
    for (const s of activeStudents) {
      const amount = amountFor(s);
      if (amount === null) continue;
      const inserted = await tx
        .insert(invoices)
        .values({
          student_id: s.id,
          type: "spp" as const,
          title,
          period_month: month,
          period_year: year,
          amount,
          allow_installment: false,
        })
        .onConflictDoNothing()
        .returning();
      if (inserted.length > 0) created += 1;
    }
  });
  return created;
}
