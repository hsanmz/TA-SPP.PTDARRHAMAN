# School Fee Manager

Jadi kita akan buat spp app nih bree.. sistemnya nnti akan ada payment gateway mungkin gampangnya nnti kita pake qris aja dari pak kasir, biar ga terlalu rebet, trus untuk notifikasi kita akan menggunakan whatsapp js, tapi untuk konfigurasi 2 ini nnti dulu kita urus belakangan, sekarang kita akan module dan fitur nya dulu, pertama parents, students jadi parents itu bisa link kali ya disebutnya ke 2 atau lebih students, nnti diatur aja, nah parents itu akan dibuat / crud manual oleh admin, students itu ada import export nya dan download xample import biar format nya ga salah (by excel yaa), nah trus tagihan, jadi tagihan itu ada 2 tagihan spp dan tagihan non spp, tagihan spp itu ditagih otomatis oleh sistem dan dikasih notifikasi oleh sistem ke whatsapp untuk suruh bayar nnti kasih link pembayaran aja langsung biar ga rebet parents nya kadanga kan bnyak yang katro yaa.  kalo non spp itu dibuat manual oleh admin, siapa aja students nya, tagihan apa dll lengkap lah pokoknya serta nominalnya pasti, trus ada pengaturan nominal spp kan digenerate otomatis ya oleh sistem, nah ini ada configurasinya agar nominalnya sesuai (non spp bisa dicicil nnti yaa, jadi mau bayar berapa dulu gituu), nnti dibuat aja configurasinya pak, trus juga ada event (misal event kelulusan, ini bisa dicicil pak, dan bisa dicicil berkali kali, dan ada progres nya pasti dan ada deadline batas waktu pembayaran walau sebenernya ga berlaku jadi akan tetep bisa bayar sampai 3 bulan setelah waktu deadline pembayaran habis pak gituu. dan kita bisa tentuin ini untuk students mana aja atau semuanya gituu), trus ada opsional infaq (opsional infaq ini ada disemua transaksi), ohh ya jadi motode pembayaran itu ada 2 (by app yaitu qris, dan offline nnti admin yang konfirmasi sudah bayar, dan pastinya ada bukti pembayaran nya yaa.) ohh yaa jngan lupa ada history transaksi dan setiap historynya ada kuitansi nya ya pak.. kuitansinya ini bisa dishare yaa.  ohh yaa jngan lupa laporan keuangan nya yaa pak dipisah tuhh mana uang offline mana uang aplikasi (yang bayar by app qris) trus uang non spp, uang spp, uang event (by event yaa), dan uang infaq. serta pengeluarannnya ya pak. ini aplikasi akan berjalan di website dan akan di wrapper ke mobile, artinya ui/ux nya harus menyesuaikan dekstop dan mobile nya ya pak, design :
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

Sistem menggunakan **Drizzle ORM** dengan arsitektur **Hybrid Database**:
1. **Database Relasional (Turso / LibSQL)**: Menyimpan semua data transaksional (siswa, tagihan, pembayaran, kuitansi, pengeluaran, akun).
2. **Database Media (Cloudflare D1 `DB_STORAGE`)**: ID `bcf1d253-7f8a-4669-b399-05d06127240f` untuk menyimpan dan melayani file bukti transfer pembayaran di edge (`/api/proofs/{id}`).
3. **Local SQLite Fallback**: `data/ta-spp.db` untuk pengembangan offline tanpa jaringan.

### Variabel Lingkungan (`.env`)
```sh
# Turso LibSQL Database
DATABASE_URL="libsql://payptd-hsanmz.aws-ap-southeast-1.turso.io"
DATABASE_AUTH_TOKEN="<turso_jwt_token>"
```

### Menjalankan Aplikasi

Menggunakan **Bun**:
```sh
# 1. Pasang dependensi
bun install

# 2. Terapkan skema & migrasi ke database (Turso / SQLite)
bun run db:apply

# 3. Seed akun awal & profil sekolah
bun run seed

# 4. Jalankan server pengembangan
bun run dev
```

### Akun Awal (Seed)
Log-in menggunakan **username**:

| Username      | Password          | Role        | Deskripsi |
| ------------- | ----------------- | ----------- | --------- |
| `superadmin`  | `SuperAdmin123!.` | Superadmin  | Akses penuh + kelola staf admin di menu Pengguna |
| `admin`       | `Admin123!.`      | Admin       | Kelola santri, tagihan, verifikasi bukti bayar, laporan |

- Jika akun belum tersedia di basis data baru, jalankan `bun run seed`.
- Orang tua santri dapat mendaftar (signup) langsung dengan username dan nomor telepon.

---

## 🎨 Design System & Paritas 100% Project PPDB

Sistem mengadopsi 100% design system dan komponen antarmuka dari **Project PPDB** (`apps/ppdb` dan `packages/ui`):

1. **Halaman Login (`/auth`)**:
   - Layout kartu tunggal terpusat penuh (*single centered card*) yang identik 100% dengan `apps/companyprofile` dan `apps/superadmin`.
   - Kanvas latar belakang warna gading (*Ivory* `--bg` / `#F7F5F0`), lapisan gradasi diagonal halus, pola titik geometris islami (`.bg-pattern-dots`), serta dua bola cahaya ambient blur (`w-72` emerald di kanan atas dan `w-96` emas di kiri bawah).
   - `AuthCard` proporsional ramping (`max-w-[22rem]`), garis aksen gradasi atas 1px (`linear-gradient(90deg, #1A6B47, #D4A853)`), badge resmi *Akses Terbatas* berikon emas `ShieldCheck`, input berikon (`User`, `Lock`, toggle `Eye`/`EyeOff`), submit button dengan spinner, dan animasi geser ke formulir pemulihan akun `AuthRecoveryForm`.

2. **Halaman Profile Baru (`/profil`)**:
   - Layout grid dua kolom (`lg:grid-cols-[320px_1fr]`).
   - Panel identitas: `AvatarEditor` (unggah lokal terkompresi WebP atau tautan URL eksternal, inisial fallback), nama lengkap, username, badge peran dinamis (`SUPERADMIN`, `ADMIN`, `ORANG TUA`), dan baris metadata (Username, Email, No. WhatsApp, Status).
   - Panel formulir: `SectionCard` untuk Informasi Profile dan `SectionCard` untuk Ganti Password.

3. **Integrasi Ganti Kata Sandi**:
   - Fitur ganti kata sandi disatukan langsung ke dalam halaman Profile (`/profil`) pada seksi *Ganti Password*.
   - Dialog terpisah (`PasswordDialog`) dan tombol gembok di header telah dihapus untuk alur navigasi terpadu.

4. **Pembersihan Jejak & Branding Lovable**:
   - Seluruh artefak identitas Lovable (komentar template, file plan `.lovable/`, modul `lovable-error-reporting.ts`) telah dibersihkan secara total.
   - Satu-satunya paket yang dipertahankan adalah dependensi build `@lovable.dev/vite-tanstack-config` di `devDependencies` yang diperlukan untuk orkestrasi build TanStack Start dan Nitro Cloudflare target.

5. **Paritas Komponen Dashboard (`@repo/ui` & `apps/ppdb` project-ppdb)**:
   - **Sidebar**: mengadopsi `DashboardSidebar` dari `packages/ui` project-ppdb dengan rail kaca putih gradien, indikator bar aktif vertikal, icon `LayoutDashboard` berlabel `"Dashboard"`, dan toggle collapse melayang beranimasi 180°.
   - **Header Sidebar & BrandMark**: mengadopsi `BrandMark` dengan logo dinamis `/logo.png`, monogram kaligrafi Arab `"ار"`, nama `"PTDARRAHMAN"`, serta titik indikator status emerald bercahaya (`bg-emerald-primary shadow-[0_0_4px_rgba(26,107,71,0.5)]`).
   - **Header Utama Bersih**: mengadopsi `DashboardHeader` yang dirancang minimalis dan bersih tanpa duplikasi judul halaman di desktop (sesuai `apps/ppdb` dan `apps/superadmin`), dilengkapi semantic search modal `Ctrl+K`, dan tombol hamburger menu pada perangkat mobile.
   - **Dropdown Profile**: mengadopsi `DashboardProfileMenu` dengan kartu profil gradasi emerald halus, avatar fallback emerald ke gelap, badge peran pill berikon dot hijau, opsi *"Lihat Profil"*, dan tombol *"Keluar"* warna `text-rose-danger`.
   - **Dashboard Utama (`/beranda`)**: identik dengan `AdminDashboardPage.tsx` di `apps/ppdb`, menggunakan `PageHeaderCard` berblok metrik dinamis (Semester Aktif, Status Kas dengan pulse dot, Santri Terdaftar), 4 kolom `StatCard`, Bento Grid grafik 6 bulan `GrowthChartCard` & alert `AttentionCard`, serta baris distribusi 3 kolom.
6. **Paritas Desain UI Seluruh Halaman Operasional (Project PPDB Standards)**:
   - **Kuitansi Resmi (`/kuitansi/$nomor`)**: Menggunakan `OfficialReceiptCard` resmi berheader zamrud pekat (`bg-emerald-950`), watermark perisai `ShieldCheck`, QR code verifikasi langsung, serta toolbar aksi di bagian atas (Kembali, Cetak Slip, WhatsApp, Salin Link).
   - **Manajemen Tagihan (`/tagihan`)**: Tata letak tabel terpadu ala `DataPendaftarPage`, metrik `PageHeaderCard`, filter jenis (`SPP`, `Non-SPP`, `Event`) & status, `ToolbarCard`, dan baris tabel interaktif dengan progres cicilan dan badge dot status.
   - **Monitoring Pembayaran (`/pembayaran`)**: Tata letak transaksi ala `PembayaranFormulirPage`, `PageHeaderCard` verifikasi kas, tabel bukti transfer, modal pratinjau bukti bayar, konfirmasi, tolak, dan batalkan.
   - **Data Wali Murid (`/orang-tua`) & Pengeluaran (`/pengeluaran`)**: Tabel administrasi bersih dengan header `bg-emerald-primary/5`, pill badge status berindikator dot, dan modal tambah/kelola cepat.
   - **Event & Kegiatan Santri (`/event`)**: Grid kartu gelombang modern dengan progress bar pelunasan, target dana, dan peserta terdaftar.
   - **Data Siswa & Profil Detail (`/siswa` & `/siswa/$studentId`)**: Tabel santri berheader zamrud, status dot, avatar inisial, serta tampilan detail 12 bulan peta SPP (Ganjil & Genap).
