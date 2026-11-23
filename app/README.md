# School Fee Manager

Jadi kita akan buat spp app nih bree.. sistemnya nnti akan ada payment gateway mungkin gampangnya nnti kita pake qris aja dari pak kasir, biar ga terlalu rebet, trus untuk notifikasi kita akan menggunakan whatsapp js, tapi untuk konfigurasi 2 ini nnti dulu kita urus belakangan, sekarang kita akan module dan fitur nya dulu, pertama parents, students jadi parents itu bisa link kali ya disebutnya ke 2 atau lebih students, nnti diatur aja, nah parents itu akan dibuat / crud manual oleh admin, students itu ada import export nya dan download xample import biar format nya ga salah (by excel yaa), nah trus tagihan, jadi tagihan itu ada 2 tagihan spp dan tagihan non spp, tagihan spp itu ditagih otomatis oleh sistem dan dikasih notifikasi oleh sistem ke whatsapp untuk suruh bayar nnti kasih link pembayaran aja langsung biar ga rebet parents nya kadanga kan bnyak yang katro yaa. kalo non spp itu dibuat manual oleh admin, siapa aja students nya, tagihan apa dll lengkap lah pokoknya serta nominalnya pasti, trus ada pengaturan nominal spp kan digenerate otomatis ya oleh sistem, nah ini ada configurasinya agar nominalnya sesuai (non spp bisa dicicil nnti yaa, jadi mau bayar berapa dulu gituu), nnti dibuat aja configurasinya pak, trus juga ada event (misal event kelulusan, ini bisa dicicil pak, dan bisa dicicil berkali kali, dan ada progres nya pasti dan ada deadline batas waktu pembayaran walau sebenernya ga berlaku jadi akan tetep bisa bayar sampai 3 bulan setelah waktu deadline pembayaran habis pak gituu. dan kita bisa tentuin ini untuk students mana aja atau semuanya gituu), trus ada opsional infaq (opsional infaq ini ada disemua transaksi), ohh ya jadi motode pembayaran itu ada 2 (by app yaitu qris, dan offline nnti admin yang konfirmasi sudah bayar, dan pastinya ada bukti pembayaran nya yaa.) ohh yaa jngan lupa ada history transaksi dan setiap historynya ada kuitansi nya ya pak.. kuitansinya ini bisa dishare yaa. ohh yaa jngan lupa laporan keuangan nya yaa pak dipisah tuhh mana uang offline mana uang aplikasi (yang bayar by app qris) trus uang non spp, uang spp, uang event (by event yaa), dan uang infaq. serta pengeluarannnya ya pak. ini aplikasi akan berjalan di website dan akan di wrapper ke mobile, artinya ui/ux nya harus menyesuaikan dekstop dan mobile nya ya pak, design :
📐 Tata Letak & Struktur (Layout)

Bento Grid Layout: Tren tata letak kotak-kotak rapi seperti menu kompartemen (populer digunakan oleh Apple, Linear, dan Stripe).

Generous Whitespace: Berikan ruang kosong yang cukup antar elemen. Jangan menumpuk informasi agar aplikasi terlihat "bernapas" dan mewah.

Pixel-Perfect Consistency: Jarak (padding dan margin) harus konsisten (biasanya menggunakan kelipatan 4px atau 8px).

🎨 Warna & Estetika

Refined Color Palette: Batasi warna. Gunakan warna dasar netral yang solid (seperti abu-abu sangat gelap obsidian, bukan hitam pekat #000) dan satu warna aksen yang mencolok (vibrant electric/neon accent) untuk tombol utama.

Subtle Gradients & Glassmorphism: Gunakan efek gradasi yang sangat tipis dan efek kaca transparan (frosted glass) untuk memberikan kesan kedalaman (depth).

🔤 Tipografi & Konten

Typography Hierarchy: Perbedaan ukuran yang tegas antara judul (headers) dan teks isi (body). Startup premium sangat mementingkan keterbacaan (readability).

Modern Sans-Serif Fonts: Gunakan font berstandar internasional seperti Inter, SF Pro (Apple), Geist, atau Satoshi.

🕹️ Pengalaman & Detail (UX/UI)

Micro-interactions: Animasi kecil yang halus saat tombol ditekan atau menu digeser.

Sleek Icons: Gunakan ikon dengan garis tipis (line icons) yang konsisten dari satu library yang sama (misalnya Lucide Icons atau Phosphor Icons).

This project was built with plain React + TanStack Start + Tailwind CSS + Drizzle ORM.

## Build with TanStack Start

Continue developing this project using the TanStack Start app.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Menggunakan **Bun**:

```sh
bun install
bun run dev
```

## Development & Konfigurasi Basis Data

Sistem menggunakan **Drizzle ORM** dengan arsitektur **Cloudflare D1 Native Database**:

1. **Database Produksi Utama (Cloudflare D1 `DB` & `DB_STORAGE`)**: ID `bcf1d253-7f8a-4669-b399-05d06127240f` (nama: `payptd`) di edge Cloudflare Workers. Menghandle seluruh tabel transaksional dan penyimpanan bukti bayar (`/api/proofs/{id}`).
2. **Local SQLite Fallback**: `data/ta-spp.db` untuk pengembangan offline tanpa jaringan dan testing otomatis (`bun test`).
3. **Turso**: Telah sepenuhnya dihapus. Sistem 100% menggunakan Cloudflare D1.

### Variabel Lingkungan (`.env`)

```sh
# Local Development & Testing (Offline SQLite)
DATABASE_URL="file:./data/ta-spp.db"
DATABASE_AUTH_TOKEN=""
```

### Menjalankan Aplikasi

Menggunakan **Bun**:

```sh
# 1. Pasang dependensi
bun install

# 2. Terapkan skema & migrasi ke database lokal (SQLite)
bun run db:apply

# 3. Seed akun awal & profil sekolah
bun run seed

# 4. Jalankan server pengembangan
bun run dev

# 5. Jalankan automated test suite (Unit, Scenario, HTTP SSR, Performance Benchmark)
bun run test
```

### Akun Awal (Seed)

Log-in menggunakan **username**:

| Username     | Password          | Role       | Deskripsi                                               |
| ------------ | ----------------- | ---------- | ------------------------------------------------------- |
| `superadmin` | `SuperAdmin123!.` | Superadmin | Akses penuh + kelola staf admin di menu Pengguna        |
| `admin`      | `Admin123!.`      | Admin      | Kelola santri, tagihan, verifikasi bukti bayar, laporan |

- Jika akun belum tersedia di basis data baru, jalankan `bun run seed`.
- Orang tua santri dapat mendaftar (signup) langsung dengan username dan nomor telepon.

---

## 🎨 Design System & Paritas 100% Project PPDB

Sistem mengadopsi 100% design system dan komponen antarmuka dari **Project PPDB** (`apps/ppdb` dan `packages/ui`):

1. **Halaman Login (`/auth`)**:
   - Layout kartu tunggal terpusat penuh (_single centered card_) yang identik 100% dengan `apps/companyprofile` dan `apps/superadmin`.
   - Kanvas latar belakang warna gading (_Ivory_ `--bg` / `#F7F5F0`), lapisan gradasi diagonal halus, pola titik geometris islami (`.bg-pattern-dots`), serta dua bola cahaya ambient blur (`w-72` emerald di kanan atas dan `w-96` emas di kiri bawah).
   - `AuthCard` proporsional ramping (`max-w-[22rem]`), garis aksen gradasi atas 1px (`linear-gradient(90deg, #1A6B47, #D4A853)`), badge resmi _Akses Terbatas_ berikon emas `ShieldCheck`, input berikon (`User`, `Lock`, toggle `Eye`/`EyeOff`), submit button dengan spinner, dan animasi geser ke formulir pemulihan akun `AuthRecoveryForm`.

2. **Halaman Profile Baru (`/profil`)**:
   - Layout grid dua kolom (`lg:grid-cols-[320px_1fr]`).
   - Panel identitas: `AvatarEditor` (unggah lokal terkompresi WebP atau tautan URL eksternal, inisial fallback), nama lengkap, username, badge peran dinamis (`SUPERADMIN`, `ADMIN`, `ORANG TUA`), dan baris metadata (Username, Email, No. WhatsApp, Status).
   - Panel formulir: `SectionCard` untuk Informasi Profile dan `SectionCard` untuk Ganti Password.

3. **Integrasi Ganti Kata Sandi**:
   - Fitur ganti kata sandi disatukan langsung ke dalam halaman Profile (`/profil`) pada seksi _Ganti Password_.
   - Dialog terpisah (`PasswordDialog`) dan tombol gembok di header telah dihapus untuk alur navigasi terpadu.

4. **Pembersihan Jejak & Branding Lovable**:
   - Seluruh artefak identitas Lovable (komentar template, file plan `.lovable/`, modul `lovable-error-reporting.ts`) telah dibersihkan secara total.
   - Satu-satunya paket yang dipertahankan adalah dependensi build `@lovable.dev/vite-tanstack-config` di `devDependencies` yang diperlukan untuk orkestrasi build TanStack Start dan Nitro Cloudflare target.

5. **Paritas Komponen Dashboard (`@repo/ui` & `apps/ppdb` project-ppdb)**:
   - **Fondasi Warna & Token Tailwind v4**: Seluruh token semantik CSS (`--color-background`, `--color-card`, `--color-primary`, `--color-border`, dsb.) dibungkus menggunakan `hsl(var(...))` di `@theme inline`, memastikan Tailwind CSS v4 menghasilkan kode warna valid (bukan transparan) dan modifier opacity seperti `bg-primary/10` menghasilkan `color-mix()` yang akurat.
   - **Kanvas & Kartu Kontras Tinggi**: Kanvas utama berlatar Gading Hangat (`#F7F5F0`, `bg-background`) dipadukan dengan permukaan kartu solid putih bersih (`#FFFFFF`, `bg-card` / `bg-white`), sudut melengkung `rounded-2xl`, dan garis batas halus (`border-slate-100` / `border-slate-200/80`), menghilangkan transparansi berlebih (*glassmorphism over*) agar data keuangan tajam dan mudah dibaca.
   - **Sidebar Bersih & Solid**: Mengadopsi `DashboardSidebar` dari `packages/ui` project-ppdb dengan latar solid `bg-white`, border pemisah `border-r border-slate-200/80`, bayangan halus `shadow-xs`, indikator bar aktif vertikal emerald, icon `LayoutDashboard` berlabel `"Dashboard"`, dan toggle collapse melayang beranimasi 180°.
   - **Header Utama & BrandMark**: Mengadopsi `DashboardHeader` solid `bg-white/95 backdrop-blur-md border-b border-slate-200/80`, `BrandMark` dinamis dengan monogram kaligrafi Arab `"ار"`, nama `"PTDARRAHMAN"`, serta titik indikator status emerald bercahaya (`bg-emerald-primary shadow-[0_0_4px_rgba(26,107,71,0.5)]`). Dilengkapi semantic search modal `Ctrl+K` dengan panel solid putih dan tombol menu mobile.
   - **Dropdown Profile**: Mengadopsi `DashboardProfileMenu` dengan tombol picu solid berborder halus, kartu profil gradasi emerald halus, avatar fallback emerald ke gelap, badge peran pill berikon dot hijau, opsi _"Lihat Profil"_, dan tombol _"Keluar"_ warna `text-rose-danger`.
   - **Dashboard Utama (`/beranda`)**: Identik dengan `AdminDashboardPage.tsx` di `apps/ppdb`, menggunakan `PageHeaderCard` berblok metrik dinamis (Semester Aktif, Status Kas dengan pulse dot, Santri Terdaftar), 4 kolom `StatCard`, Bento Grid grafik 6 bulan `GrowthChartCard` & alert `AttentionCard`, serta baris distribusi 3 kolom.
6. **Paritas Desain UI Seluruh Halaman Operasional (Project PPDB Standards)**:
   - **Kuitansi Resmi (`/kuitansi/$nomor`)**: Menggunakan `OfficialReceiptCard` resmi berheader zamrud pekat (`bg-emerald-950`), watermark perisai `ShieldCheck`, QR code verifikasi langsung, serta toolbar aksi di bagian atas (Kembali, Cetak Slip, WhatsApp, Salin Link).
   - **Manajemen Tagihan (`/tagihan`)**: Tata letak tabel terpadu ala `DataPendaftarPage`, metrik `PageHeaderCard`, filter jenis (`SPP`, `Non-SPP`, `Event`) & status, `ToolbarCard`, dan baris tabel interaktif dengan progres cicilan dan badge dot status.
   - **Monitoring Pembayaran (`/pembayaran`)**: Tata letak transaksi ala `PembayaranFormulirPage`, `PageHeaderCard` verifikasi kas, tabel bukti transfer, modal pratinjau bukti bayar, konfirmasi, tolak, dan batalkan.
   - **Data Wali Murid (`/orang-tua`) & Pengeluaran (`/pengeluaran`)**: Tabel administrasi bersih dengan header `bg-emerald-primary/5`, pill badge status berindikator dot, dan modal tambah/kelola cepat.
   - **Event & Kegiatan Santri (`/event`)**: Grid kartu gelombang modern dengan progress bar pelunasan, target dana, dan peserta terdaftar.
   - **Data Siswa & Profil Detail (`/siswa` & `/siswa/$studentId`)**: Tabel santri berheader zamrud, status dot, avatar inisial, serta tampilan detail 12 bulan peta SPP (Ganjil & Genap).

---

## 🧪 Pengujian Otomatis & Verifikasi Sistem (Automated Tests)

Seluruh fitur sistem diuji secara otomatis dan lolos 100% menggunakan test runner bawaan Bun:

```sh
# Menjalankan seluruh test suite (Unit Crypto, Account Scenarios 1-12, HTTP SSR, Performance)
DATABASE_URL="file:./data/ta-spp.db" CRON_SECRET="test-secret" bun test --timeout 30000

# Menjalankan pengujian spesifik skenario manajemen akun & relasi wali-santri (12 skenario)
DATABASE_URL="file:./data/ta-spp.db" bun test --timeout 30000 src/test/account-scenarios.test.ts

# Menjalankan pengujian cryptographic auth & session lifecycle
DATABASE_URL="file:./data/ta-spp.db" bun test --timeout 30000 src/test/unit-crypto-auth.test.ts

# Menjalankan pengujian SSR Cloudflare worker & cron endpoints
DATABASE_URL="file:./data/ta-spp.db" CRON_SECRET="test-secret" bun test --timeout 30000 src/test/http-ssr.test.ts
```

### Fitur Keamanan & Manajemen Akun Terverifikasi

1. **Relasi Wali Murid 1-ke-Banyak (1-to-Many)**: Satu akun wali dapat mengelola banyak santri sekaligus dengan switcher dinamis di dashboard beranda (`/beranda`).
2. **Isolasi Tagihan & IDOR Defense**: Verifikasi ketat otorisasi hubungan orang tua-santri pada `submitPayment` mencegah manipulasi tagihan santri lain (_Insecure Direct Object Reference_).
3. **Isolasi Riwayat Pembayaran Wali Murid**: Query `listPayments` bagi wali secara dinamis memfilter riwayat berdasarkan seluruh `student_id` yang terhubung via `parent_students`. Wali dapat melihat seluruh transaksi anak-anaknya—termasuk pembayaran tunai yang dicatat admin/kasir di kantor sekolah—tanpa bocornya transaksi santri lain.
4. **Proteksi Concurrency & Atomic Transaction**: Mutasi pembayaran (`recordPayment`, `confirmPayment`, `voidPayment`) dilindungi dalam `db.transaction` atomik dengan status guard `where(eq(status, ...))`. Konfirmasi ganda atau pembatalan simultan menghasilkan 0 baris terdampak dan otomatis digagalkan.
5. **Manajemen Status Akun & Revokasi Sesi**: Tombol aktif/nonaktif akun wali di `/orang-tua` dan akun staf di `/pengguna` yang secara instan menghapus sesi aktif dan menolak akses masuk saat dinonaktifkan.
6. **CRON Otomasi Tagihan SPP Terproteksi**: Endpoint `/api/cron/generate-spp` mewajibkan HTTP POST dan token `Bearer` rahasia `CRON_SECRET` dengan validasi parameter tahun (2000-2100) dan bulan (1-12).
7. **Idempotensi Penagihan SPP**: Pemicuan ganda penagihan SPP untuk periode bulan dan tahun yang sama dijamin 100% tidak menghasilkan duplikasi tagihan berkat indeks parsial unik `invoices_spp_unique`.
