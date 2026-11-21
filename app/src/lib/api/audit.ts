import { createServerFn } from "@tanstack/react-start";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditLogs, users } from "../../../drizzle/schema";
import { requireAdmin } from "@/lib/backend/auth";

export const listAuditLogs = createServerFn({ method: "POST" })
  .validator(
    z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const total = await db
      .select({ n: sql<number>`count(*)` })
      .from(auditLogs)
      .get();
    const rows = await db
      .select({
        id: auditLogs.id,
        user_id: auditLogs.user_id,
        action: auditLogs.action,
        entity_type: auditLogs.entity_type,
        entity_id: auditLogs.entity_id,
        details: auditLogs.details,
        created_at: auditLogs.created_at,
        username: users.username,
        full_name: users.full_name,
      })
      .from(auditLogs)
      .leftJoin(users, sql`${users.id} = ${auditLogs.user_id}`)
      .limit(data.pageSize)
      .offset((data.page - 1) * data.pageSize)
      .orderBy(desc(auditLogs.created_at))
      .all();
    return { rows, total: total?.n ?? 0 };
  });

export const listActionLabels: Record<string, string> = {
  login: "Masuk",
  logout: "Keluar",
  signup: "Daftar",
  change_password: "Ganti kata sandi",
  create_admin_user: "Buat user admin",
  remove_admin_role: "Cabut akses admin",
  reset_password: "Reset kata sandi",
  create_student: "Tambah siswa",
  update_student: "Ubah siswa",
  archive_student: "Arsip siswa",
  import_students: "Impor siswa",
  create_invoice: "Buat tagihan",
  archive_invoice: "Arsip tagihan",
  generate_spp: "Buat tagihan SPP",
  create_event: "Buat event",
  submit_payment: "Ajukan pembayaran",
  record_payment: "Catat pembayaran",
  confirm_payment: "Konfirmasi pembayaran",
  reject_payment: "Tolak pembayaran",
  void_payment: "Batalkan pembayaran",
  create_expense: "Catat pengeluaran",
  delete_expense: "Hapus pengeluaran",
  create_parent: "Tambah orang tua",
  delete_parent: "Hapus orang tua",
  link_parent_student: "Hubungkan siswa",
  unlink_parent_student: "Lepas siswa",
  link_parent_account: "Tautkan akun",
  create_spp_setting: "Tambah nominal SPP",
  activate_spp_setting: "Aktifkan nominal SPP",
  deactivate_spp_setting: "Nonaktifkan nominal SPP",
  delete_spp_setting: "Hapus nominal SPP",
  update_school_profile: "Ubah profil sekolah",
  update_bank_account: "Simpan rekening bank",
  delete_bank_account: "Hapus rekening bank",
  update_academic_year: "Simpan tahun ajaran",
  delete_academic_year: "Hapus tahun ajaran",
  update_bill_category: "Simpan kategori tagihan",
  delete_bill_category: "Hapus kategori tagihan",
};
