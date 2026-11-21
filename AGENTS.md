# Pedoman Pengembangan & Aturan Kerja Agen AI (Project Guidelines)

Dokumen ini adalah pedoman wajib bagi seluruh agen kecerdasan buatan (AI) maupun pengembang (developer) pada sesi manapun yang berinteraksi atau mengerjakan repositori ini.

---

## ⚠️ 1. ATURAN WAJIB: PEMBARUAN DOKUMENTASI (MANDATORY)

> [!IMPORTANT]
> **Setiap kali melakukan perubahan kode, fitur, arsitektur, skema basis data, alur bisnis, maupun konfigurasi, agen/pengembang WAJIB memperbarui dokumentasi yang relevan.**

1. **Sinkronisasi Kode & Dokumentasi**:
   - Jangan pernah menyelesaikan tugas pengubahan fitur/kode tanpa mengecek dan memperbarui dokumen acuan.
   - Jika mengubah skema DB atau menambah entitas baru: perbarui `app/drizzle/schema.ts`, `app/README.md`, `README.md`, dan dokumentasi ERD/Bab 4 di `.docs/`.
   - Jika mengubah konfigurasi env atau arsitektur deployment: perbarui `app/README.md`, `README.md`, dan file `.env.example`.
   - Jika menambah atau mengubah alur bisnis (misal cicilan event, status invoice, alur kuitansi): sesuaikan `PRD-v2.md` dan `README.md`.
   - Jika mengubah UI/UX, tema, atau komponen: sesuaikan `DESIGN.md`.

2. **Aturan Khusus Laporan Skripsi/Tugas Akhir (`.docs/`)**:
   - `LAPORAN TA.docx` adalah dokumen induk. BAB 1–3 yang sudah ACC tidak boleh diubah tanpa izin khusus.
   - Sinkronisasi Dua Arah: Perubahan pada bab terkait di `LAPORAN TA.docx` harus selalu identik dengan file potongan `BAB-N-*.docx` (gunakan script sinkronisasi `.docs/tools/sync-bab.py`).
   - Format Baku Laporan: Margin 4 cm (kiri, atas, kanan, bawah), font Arial 12pt, line spacing 1.5, first line indent 1 cm, caption 9pt, heading `BAB %1`.
   - Konsistensi Penulisan Basis Data di Skripsi: Sesuai aturan akademik, basis data pada laporan ditulis secara konsisten sebagai **SQLite / Cloudflare D1**.

---

## 🏛️ 2. ARSITEKTUR BASIS DATA & KONEKSI

Sistem menggunakan model *Hybrid Database Architecture*:

1. **Basis Data Relasional Utama (Primary Relational DB)**:
   - **Provider**: **Turso (LibSQL)**
   - **URL**: `libsql://payptd-hsanmz.aws-ap-southeast-1.turso.io`
   - **ORM**: Drizzle ORM (`app/drizzle/schema.ts`)
   - **Tabel**: `users`, `sessions`, `user_roles`, `students`, `parents`, `parent_students`, `spp_settings`, `events`, `invoices`, `payments`, `expenses`, `school_settings`, `bank_accounts`, `academic_years`, `bill_categories`, `audit_logs`.
   - **Environment Variables**:
     - `DATABASE_URL`: URL koneksi Turso atau SQLite local
     - `DATABASE_AUTH_TOKEN`: Token JWT Turso

2. **Basis Data Media / Bukti Transfer (Edge Storage DB)**:
   - **Provider**: **Cloudflare D1** (`ta-spp-storage`)
   - **Database ID**: `bcf1d253-7f8a-4669-b399-05d06127240f`
   - **Binding**: `DB_STORAGE` (dikonfigurasikan di `app/wrangler.json`)
   - **Fungsi**: Menyimpan payload gambar bukti transfer pembayaran (`payment_proofs`) di edge Cloudflare Workers agar database utama tidak membengkak dan akses gambar cepat melalui endpoint `/api/proofs/{id}`.

3. **Pengembangan Lokal (Local Development Fallback)**:
   - Jika offline atau tanpa kredensial remote, fallback database lokal berada di `app/data/ta-spp.db`.

---

## 💻 3. TEKNOLOGI & KONVENSI KODE

- **Framework**: TanStack Start + React 19 (Server Functions via `createServerFn` & SSR)
- **Styling**: Tailwind CSS v4 + Radix UI + Lucide React
- **Runtime**: Bun / Node.js
- **Deployment Target**: Cloudflare Workers via Wrangler (`wrangler.json`)
- **Autentikasi**: Custom Session-based Cookie Auth (`users`, `sessions`, `user_roles`) dengan role:
  - `superadmin`: Akses penuh termasuk manajemen akun admin sekolah
  - `admin`: Manajemen santri, tagihan SPP, verifikasi bukti bayar, pengeluaran, laporan
  - `parent`: Portal wali murid untuk cek tagihan, unggah bukti bayar, dan kuitansi

---

## 📋 4. DAFTAR DOKUMEN ACUAN

| Berkas | Tujuan |
|---|---|
| `README.md` | Gambaran umum proyek, arsitektur, dan ringkasan fitur |
| `app/README.md` | Petunjuk instalasi, development, akun awal, dan catatan fitur aplikasi |
| `DESIGN.md` | Design System resmi Ar-Rahman (palet warna, tipografi, micro-interactions, kuitansi) |
| `PRD-v2.md` / `PRD-v.1.md` | Spesifikasi kebutuhan fungsional & modul bisnis |
| `.docs/AGENTS.md` | Prosedur khusus editing berkas laporan Tugas Akhir (.docx) |
| `.docs/LAPORAN TA.docx` | Naskah lengkap Laporan Tugas Akhir |
