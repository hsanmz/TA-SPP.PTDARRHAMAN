# Sistem Pembayaran SPP & Manajemen Keuangan Sekolah — Ar-Rahman

> **Pesantren Tahfidz Qur'an dan Digital Ar-Rahman**  
> Platform manajemen SPP (Sumbangan Pembinaan Pendidikan), tagihan non-SPP, verifikasi bukti pembayaran, dan laporan keuangan sekolah.

---

## 📌 Dokumen Acuan Resmi

| Dokumen | Deskripsi & Tautan |
|---|---|
| **Pedoman AI & Pengembang** | [AGENTS.md](AGENTS.md) — Aturan wajib pembaruan dokumentasi, standar penulisan naskah TA (.docs), dan panduan arsitektur hybrid database. |
| **Design System & Visual Identity** | [DESIGN.md](DESIGN.md) — Panduan desain visual, palet warna (*Warm Ivory*, *Islamic Emerald*, *Regal Gold*, *Obsidian*), tipografi, token elevasi, komponen, UX pattern verifikasi kasir, dan standar e-receipt/kuitansi digital. |
| **Product Requirements Document (PRD)** | [PRD-v.1.md](PRD-v.1.md) — Spesifikasi kebutuhan bisnis fungsional resmi (Role Admin & Murid, alur rentang bulan SPP, cicilan, upload bukti transfer, verifikasi approve/reject, pencatatan pengeluaran operasional, kuitansi, dan laporan ekspor). |

---

## 🏛️ Arsitektur Proyek

- **Aplikasi Utama:** [`app/`](app/) — Berbasis **React 19 + TanStack Start (SSR & Server Functions) + Tailwind CSS v4**.
- **Basis Data Utama (Produksi):** **Cloudflare D1** (`payptd`, database_id: `bcf1d253-7f8a-4669-b399-05d06127240f`) dengan Drizzle ORM native D1 driver (`drizzle-orm/d1`).
- **Penyimpanan Media Bukti Transfer:** **Cloudflare D1** (`DB_STORAGE`, ID `bcf1d253-7f8a-4669-b399-05d06127240f`) via `wrangler.json`.
- **Pengembangan Offline:** Local SQLite fallback (`app/data/ta-spp.db`).
- **Naskah Tugas Akhir:** [`.docs/`](.docs/) — Naskah laporan akademik skripsi (`LAPORAN TA.docx`).

---

## 🚀 Fitur Utama Berdasarkan PRD-V1

1. **Role Pengguna:**
   - **Admin Keuangan:** Manajemen murid, penetapan tarif SPP bulanan, verifikasi bukti pembayaran (approve/reject dengan alasan), pencatatan transaksi manual (tunai langsung), manajemen pengeluaran operasional, dan cetak laporan/kuitansi.
   - **Murid / Wali Santri:** Monitoring status tagihan, pembayaran SPP fleksibel (rentang bulan 1–12), pembayaran tagihan non-SPP, upload bukti transfer, riwayat transaksi, dan akses e-kuitansi.
2. **Kuitansi Fleksibel & Digital:**
   - Format slip e-receipt kompak (*shareable* ke WhatsApp wali murid & hemat kertas/cetak kasir) dilengkapi QR Code verifikasi HMAC dan tanda tangan digital.
3. **Laporan & Rekapitulasi Keuangan:**
   - Rekap matriks SPP 12-bulan per murid.
   - Laporan arus kas (Penerimaan vs Pengeluaran Operasional) dalam format ISO A4 Landscape dan ekspor Excel/PDF.

---

## 🎨 Paritas Desain 100% Project PPDB & Profil Terpadu

Aplikasi telah mengadopsi 100% visual identity dan design tokens resmi dari **Project PPDB** (`apps/ppdb` dan `packages/ui`):

- **Login Page (`/auth`)**: Layout kartu tunggal terpusat (*single centered card*) identik 100% dengan `apps/companyprofile` dan `apps/superadmin` dari Project PPDB. Dilengkapi latar kanvas warna gading (*Ivory* `#F7F5F0`), lapisan gradasi diagonal halus, pola titik geometris islami (`.bg-pattern-dots`), dua bola ambient blur (emerald di kanan atas, emas di kiri bawah), serta `AuthCard` ramping (`max-w-[22rem]`) ber-badge resmi *Akses Terbatas*, input berikon (`User`, `Lock`, toggle `Eye`/`EyeOff`), submit spinner, dan animasi geser ke formulir pemulihan akun `AuthRecoveryForm`.
- **Halaman Profil Terpadu (`/profil`)**: Struktur dua kolom (`lg:grid-cols-[320px_1fr]`) dengan bar navigasi atas berikon kembali, panel kiri `AvatarEditor` (unggah lokal WebP/URL eksternal, inisial fallback, status badge aktif, metadata akun), serta panel kanan `SectionCard` untuk Informasi Profile dan Ganti Password.
- **Integrasi Ganti Password**: Pengelolaan kata sandi kini terpusat di dalam halaman Profil (`/profil`). Modal dialog terpisah dan tombol gembok di header telah dihapus untuk alur navigasi yang bersih dan satu pintu.
- **Pembersihan Total Jejak Lovable**: Seluruh artefak identitas, komentar template, berkas rencana `.lovable/`, dan modul error reporting lovable telah dibersihkan secara tuntas. Dependensi runtime/build tetap utuh untuk menjaga stabilitas produksi.
- **Komponen Dashboard & Chrome Layout (`@repo/ui` & `apps/ppdb`)**: Chrome dashboard (Sidebar kaca dengan icon `LayoutDashboard` berlabel *"Dashboard"*, Header Sidebar dengan BrandMark & logo resmi/monogram Arab `"ار"` dan glowing dot, Top Header minimalis tanpa duplikasi judul breadcrumb di desktop sesuai `apps/ppdb` dilengkapi semantic search `Ctrl+K`, dan Profile Dropdown menu bergradien emerald) diselaraskan 100% identik dengan standar Project PPDB.
- **Halaman Dashboard Utama (`/beranda`)**: Mengadopsi arsitektur `AdminDashboardPage.tsx` di `apps/ppdb`, menggunakan `PageHeaderCard` berblok metrik dinamis (Semester Aktif, Status Kas Operasional dengan animated pulse, dan Santri Terdaftar), deretan 4 kartu metrik `StatCard`, Bento Grid 2:1 (`GrowthChartCard` & `AttentionCard`), serta baris distribusi 3 kolom (`DonutCard`, `BreakdownCard`, `ActivityLogsCard`).
- **Halaman Operasional Bergaya PPDB**:
  - **Kuitansi Resmi (`/kuitansi/$nomor`)**: Memakai `OfficialReceiptCard` berheader gradien zamrud pekat (`#032617`), watermark perisai `ShieldCheck`, QR code verifikasi langsung, serta toolbar aksi (Cetak Slip, WhatsApp, Salin Link).
  - **Manajemen Tagihan (`/tagihan`)**: Tata letak tabel terpadu ala `DataPendaftarPage`, metrik `PageHeaderCard`, filter jenis & status, `ToolbarCard`, dan progres bar cicilan.
  - **Monitoring Pembayaran (`/pembayaran`)**: Tata letak transaksi ala `PembayaranFormulirPage`, `PageHeaderCard` verifikasi kas, tabel bukti transfer, modal pratinjau bukti bayar, konfirmasi, tolak, dan batalkan.
  - **Data Wali Murid (`/orang-tua`) & Pengeluaran (`/pengeluaran`)**: Tabel modern dengan header `bg-emerald-primary/5`, pill badge status berindikator dot, dan modal tambah/kelola cepat.
  - **Event & Kegiatan Santri (`/event`)**: Grid kartu berdesain gelombang PPDB dengan progress bar pelunasan, target dana, dan peserta terdaftar.

---

## 🧪 Verifikasi Sistem & Keamanan Teruji (Production Ready)

- **Automated Testing Suite (37 Tests, 100% Pass Rate)**:
  - `unit-crypto-auth.test.ts`: Verifikasi enkripsi PBKDF2 (100.000 iterasi), SHA-256 tokens, penanganan kadaluarsa sesi, pemetaan hak akses berbasis peran (RBAC).
  - `account-scenarios.test.ts`: 12 skenario riil mencakup relasi 1 wali banyak murid (1-to-many), isolasi tagihan antar murid, mitigasi IDOR, pemutusan hubungan tanpa orphan deletion, penonaktifan akun & revokasi instan sesi, transisi kelas/data santri, batasan unik integritas basis data, idempotensi penagihan SPP, isolasi riwayat transaksi multi-anak wali (termasuk pembayaran tunai dicatat kasir), serta proteksi transaksi atomik terhadap race condition konfirmasi/pembatalan ganda.
  - `http-ssr.test.ts`: Pengujian SSR Cloudflare worker, halaman login publik (`/auth`), slip kuitansi digital (`/kuitansi/:receiptNumber`), dan proteksi CRON endpoint (`/api/cron/generate-spp` dengan `CRON_SECRET`).
  - `performance-benchmark.test.ts`: Pengujian kinerja hashing PBKDF2, konkurensi query database (50 parallel reads: Avg/P50/P95/P99 latency), serta skalabilitas pembuatan dan resolusi token sesi.
  - CI/CD Quality Gate: Otomasi continuous integration via GitHub Actions (`.github/workflows/ci.yml`) yang memvalidasi type check, linting, test suite, dan production build otomatis.
- **Audit Trail & Keamanan Endpoint**: Seluruh mutasi data sensitif (santri, tagihan, pembayaran, pengeluaran, status akun) tercatat pada tabel `audit_logs` dan seluruh endpoint otomatisasi terlindungi autentikasi ketat.
