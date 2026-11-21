# Design System & Visual Identity — Ar-Rahman

> **Pesantren Tahfidz Qur'an dan Digital Ar-Rahman**
> Dokumen Panduan Desain Antarmuka (UI/UX), Sistem Desain Visual, Token Desain, Tipografi, Komponen, dan Standar Estetika untuk Sistem Pembayaran SPP & Tagihan Sekolah.
> *Catatan: Dokumen ini berfokus pada Visual & UX Design. Untuk spesifikasi kebutuhan fungsional dan aturan bisnis sistem, rujuk ke [PRD-v.1.md](PRD-v.1.md).*

---

## 📑 Daftar Isi

1. [Filosofi Desain](#1-filosofi-desain)
2. [Palet Warna & Token Desain (Color Tokens)](#2-palet-warna--token-desain-color-tokens)
3. [Sistem Tipografi (Typography)](#3-sistem-tipografi-typography)
4. [Elevasi, Bayangan & Glassmorphism](#4-elevasi-bayangan--glassmorphism)
5. [Gerak & Transisi (Motion & Animation)](#5-gerak--transisi-motion--animation)
6. [Geometri, Grid & Tata Letak Responsif](#6-geometri-grid--tata-letak-responsif)
7. [Arsitektur Komponen Bersama & Primitif](#7-arsitektur-komponen-bersama--primitif)
8. [Pola Form & Interaksi Pengguna (UX Patterns Berbasis PRD-V1)](#8-pola-form--interaksi-pengguna-ux-patterns-berbasis-prd-v1)
9. [Standar Desain Kuitansi & Dokumen Cetak](#9-standar-desain-kuitansi--dokumen-cetak)
10. [Aturan Wajib Desain & Aksesibilitas](#10-aturan-wajib-desain--aksesibilitas)

---

## 1. Filosofi Desain

Identitas visual Pesantren Tahfidz Qur'an dan Digital Ar-Rahman memadukan dua nilai luhur yang saling melengkapi dalam pengelolaan administrasi dan keuangan:

```
      🌿 Spiritual & Tradisi Islam        ⚡ Modernitas Digital & Presisi
      (Keagungan, Keikhlasan, Ketenangan)  (Akurasi Finansial, Kejelasan, Kecepatan)
                            \                    /
                             \                  /
                              ▼                ▼
                     [ IDENTITAS VISUAL AR-RAHMAN ]
```

- **Keagungan & Ketenangan (Islamic Serenity):** Aksen Hijau Zamrud (*Islamic Emerald*) dan Emas Kemuliaan (*Regal Gold*) di atas kanvas Gading Alami (*Warm Ivory*), menghadirkan suasana terpercaya, sejuk di mata, dan bersahaja khas pesantren modern.
- **Ketegasan Digital & Akurasi Finansial (Digital Precision):** Garis tepi halus (*hairline borders*), tipografi angka tabular yang sejajar rapi (*tabular figures*), umpan balik status transaksi seketika (*instant feedback*), serta mikro-interaksi yang jelas tanpa ambiguitas.
- **Kejelasan Finansial Tanpa Beban Kognitif (*Zero-Ambiguity Financial Data*):** Informasi nominal rupiah, status pelunasan (Lunas, Belum Lunas, Cicilan, Menunggu Verifikasi), serta tanggal jatuh tempo disajikan dengan hierarki tegas tanpa dekorasi visual yang membingungkan orang tua atau staf tata usaha.

---

## 2. Palet Warna & Token Desain (Color Tokens)

Sistem menggunakan token warna semantik yang didefinisikan pada tema desain aplikasi:

### 2.1. Warna Inti (Core Palette)

| Token Semantik | Nilai Heksadesimal | Peran & Penggunaan |
|---|---|---|
| `ivory` | `#F7F5F0` | Latar belakang kanvas utama aplikasi (memberikan atmosfer hangat, ramah di mata dibanding putih polos) |
| `elevated` | `#FFFFFF` | Permukaan kartu (*cards*), modal dialog, panel popup kasir, dan kontainer formulir |
| `obsidian` | `#1A1A1A` | Teks judul utama, nominal saldo/pembayaran berbobot tinggi, kontras tajam |
| `slate` (DEFAULT) | `#6B6B6B` | Teks pendukung, label input sekunder, deskripsi bantuan transaksi |
| `slate.light` | `#949494` | Placeholder input, ikon non-aktif, batas divider halus tabel |
| `slate.dark` | `#4A4A4A` | Teks badan (*body text*) dan keterangan rincian kuitansi |

### 2.2. Aksen Karakter Institusi & Status Keuangan

| Token Semantik | Nilai / Nilai Alfa | Karakter & Penggunaan |
|---|---|---|
| `emerald.primary` | `#1A6B47` | Identitas utama institusi — tombol aksi primer (CTA), badge resmi, navbar header |
| `emerald.bright` | `#22C55E` | Indikator status sukses, verifikasi disetujui (*accepted*), tagihan lunas |
| `emerald.dark` | `#135235` | Status hover/active tombol primary, header tabel laporan keuangan |
| `emerald.light` | `#E8F5EE` | Latar belakang badge lunas, highlight baris tabel aktif saat dipilih |
| `emerald.glow` | `rgba(34, 197, 94, 0.25)` | Cahaya aksen (*glow*) pada kartu tagihan lunas dan tombol fokus |
| `gold.accent` | `#D4A853` | Aksen kemuliaan tahfidz — status pembayaran cicilan/sebagian, ornamen kuitansi |
| `gold.light` | `#F0C878` | Hover aksen emas, highlight kartu pending |
| `gold.dark` | `#B88F3D` | Teks aksen emas di atas permukaan terang (teks status cicilan) |
| `gold.bg` | `#FEFAEE` | Latar belakang kartu informasi cicilan dan catatan khusus |
| `gold.glow` | `rgba(212, 168, 83, 0.25)` | Glow aura status menunggu verifikasi (*pending verification*) |
| `wa.green` | `#25D366` | Tautan dan tombol share WhatsApp (notifikasi tagihan & kirim e-kuitansi) |
| `telegram.blue` | `#2AABEE` | Tautan kontak bantuan eksternal dan notifikasi sistem |
| `rose.danger` | `#FF3B30` | Peringatan kritis, status tagihan menunggak/unpaid, penolakan bukti (*reject*), tombol hapus |
| `rose.light` | `#FFEEEE` | Latar peringatan error, box alasan pembayaran ditolak |

### 2.3. Pemetaan Variabel CSS HSL (Theme Root)

Ditetapkan di `:root` CSS aplikasi:

```css
:root {
  --background: 43 30% 95%;       /* #F7F5F0 Warm Ivory */
  --foreground: 0 0% 10%;         /* #1A1A1A Obsidian */
  --card: 0 0% 100%;              /* #FFFFFF Pure White */
  --card-foreground: 0 0% 10%;
  --primary: 153 61% 26%;         /* #1A6B47 Islamic Emerald Primary */
  --primary-foreground: 0 0% 100%;
  --secondary: 43 20% 92%;
  --secondary-foreground: 0 0% 10%;
  --muted: 43 20% 92%;
  --muted-foreground: 0 0% 42%;
  --accent: 40 60% 58%;           /* #D4A853 Regal Gold */
  --accent-foreground: 0 0% 10%;
  --destructive: 3 100% 59%;      /* #FF3B30 Rose Red */
  --destructive-foreground: 0 0% 100%;
  --border: 153 12% 88%;          /* Emerald-tinted hairline border */
  --input: 153 12% 88%;
  --ring: 153 61% 26%;
  --radius: 0.75rem;              /* 12px standar sudut melengkung kartu */
}
```

---

## 3. Sistem Tipografi (Typography)

Tipografi disusun berjenjang dengan pembagian peran yang tegas antara branding institusi, judul struktural, isi data antarmuka, dan teks angka finansial:

```
[ Playfair Display / Georgia ]  ──► Brand Hero, Judul Kuitansi Resmi & Page Title
[ DM Sans ]                    ──► Judul Bagian, Card Title, Header Tabel & Tombol
[ Inter ]                      ──► Teks Antarmuka, Deskripsi, Form Label & Teks Tabel
[ Amiri ]                      ──► Ayat Suci Al-Qur'an, Doa Infaq & Basmalah Kuitansi
[ Inter Monospace / Tabular ]  ──► Nominal Rupiah, No. Kuitansi (KWT-...), NISN, Tanggal ISO
```

### 3.1. Rincian Font Family

| Nama Token | Font Primer & Cadangan | Peruntukan Khusus |
|---|---|---|
| `font-brand` | `'Playfair Display', Georgia, serif` | Judul utama lembaga, header kuitansi resmi, logo teks institusi |
| `font-heading` | `'DM Sans', 'Inter', sans-serif` | H1–H4 judul bagian halaman, judul kartu KPI, modal header, tombol utama |
| `font-sans` / `font-body` | `'Inter', system-ui, sans-serif` | Paragraf teks, teks input form, penjelasan status, catatan admin |
| `font-arabic` | `'Amiri', 'Traditional Arabic', serif` | Basmalah kuitansi, ayat zakat/infaq, doa keberkahan (*dir="rtl"*) |
| `font-mono` / `font-numbers` | `'Inter', monospace` | Angka nominal rupiah, kode kuitansi, NIS murid, angka tabular perbandingan |

### 3.2. Skala Hierarki Tipografi

| Level | Ukuran (Desktop) | Ukuran (Mobile) | Line Height | Weight | Penggunaan |
|---|---|---|---|---|---|
| **Display Title** | `2.25rem (36px)` | `1.75rem (28px)` | `1.2` | Bold (700) | Judul brand mark & header slip kuitansi |
| **Heading 1 (H1)** | `1.75rem (28px)` | `1.375rem (22px)` | `1.25` | Semibold (600) | Judul halaman portal dashboard & menu utama |
| **Heading 2 (H2)** | `1.375rem (22px)` | `1.125rem (18px)` | `1.3` | Semibold (600) | Judul modul (Bayar SPP, Verifikasi Bukti) |
| **Heading 3 (H3)** | `1.125rem (18px)` | `1rem (16px)` | `1.4` | Medium (500) | Judul kartu ringkasan, modal title |
| **Body (P)** | `0.875rem (14px)` | `0.875rem (14px)` | `1.5` | Regular (400) | Teks penjelasan, rincian biaya, catatan |
| **Label / Action** | `0.8125rem (13px)` | `0.8125rem (13px)` | `1.4` | Medium (500) | Label form, item navigasi, filter toolbar |
| **Badge / Micro** | `0.6875rem (11px)` | `0.6875rem (11px)` | `1.2` | Semibold (600) | Status pill (Lunas, Pending, Cicilan) |
| **Stat KPI (Number)** | `1.75rem–2rem` | `1.5rem` | `1.1` | Bold (700) | Angka saldo kas, total penerimaan, sisa tagihan |

> [!NOTE]
> Semua tampilan angka nominal rupiah wajib menggunakan utility class `num` (*tabular figures*: `font-variant-numeric: tabular-nums`) dan format baku mata uang Indonesia (contoh: `Rp 1.250.000`).

---

## 4. Elevasi, Bayangan & Glassmorphism

Untuk menghadirkan kedalaman visual yang elegan di atas kanvas `ivory`, sistem menerapkan standar efek kedalaman berikut:

### 4.1. Token Bayangan (Box Shadow)

```css
boxShadow: {
  /* Kartu kaca lembut mengambang di atas kanvas ivory */
  'glass': '0 8px 32px rgba(26, 107, 71, 0.06)',

  /* Efek elevasi aktif saat kartu disentuh atau hover */
  'glass-hover': '0 12px 40px rgba(26, 107, 71, 0.12)',

  /* Aura hijau zamrud untuk indikator sukses / tagihan lunas */
  'glow-emerald': '0 0 20px rgba(34, 197, 94, 0.35)',

  /* Aura emas untuk status menunggu verifikasi / cicilan aktif */
  'glow-gold': '0 0 20px rgba(212, 168, 83, 0.35)',
}
```

### 4.2. Glassmorphism & Transparansi

- **Floating Header / Navbar:** Menggunakan latar putih tembus pandang `rgba(255, 255, 255, 0.88)` dengan efek `backdrop-blur-md` (12px) dan garis tepi halus `border: 1px solid rgba(26, 107, 71, 0.08)`.
- **Modal Dialog & Bukti Transfer Zoom:** Latar hitam lembut `rgba(26, 26, 26, 0.5)` berpadu dengan `backdrop-blur-sm` (4px).
- **Sticky Form & Action Footers:** Latar `rgba(247, 245, 240, 0.95)` berpadu dengan `backdrop-blur-md` untuk menjaga kenyamanan tombol aksi di perangkat mobile saat scroll panjang.

---

## 5. Gerak & Transisi (Motion & Animation)

Gerakan dirancang responsif, fungsional, dan menenangkan, tanpa memperlambat interaksi pengguna.

### 5.1. Kurva Easing Kustom (Brand Bezier)

```css
.ease-brand-pill {
  transition-duration: 350ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 5.2. Keyframe Animations

| Nama Animasi | Durasi & Kurva | Perilaku & Penggunaan |
|---|---|---|
| `slide-up` | `0.35s cubic-bezier(0.32, 0.72, 0, 1)` | Elemen meluncur dari bawah (modal verifikasi, popover bukti bayar) |
| `slide-down` | `0.3s ease-out` | Notifikasi banner / alert transaksi masuk turun dari atas |
| `scale-in` | `0.25s cubic-bezier(0.34, 1.56, 0.64, 1)` | Dialog konfirmasi persetujuan (*approval*) atau dialog penolakan |
| `fade-in` | `0.2s ease-out` | Pergantian tab, filter bulan SPP, refresh data tabel |
| `pulse-subtle` | `3s cubic-bezier(0.4, 0, 0.6, 1) infinite` | Indikator live status antrean pending verifikasi kasir |

---

## 6. Geometri, Grid & Tata Letak Responsif

### 6.1. Acuan Geometri & Kontainer

```css
:root {
  /* Lebar maksimal kontainer dashboard & tabel data */
  --dashboard-max-width: 80rem; /* 1280px */

  /* Radius baku elemen */
  --radius-card: 0.75rem;       /* 12px */
  --radius-button: 0.5rem;      /* 8px */
  --radius-badge: 9999px;       /* Pill shape */
}
```

### 6.2. Breakpoint Responsif

| Token Breakpoint | Lebar Minimum | Target Perangkat Utama |
|---|---|---|
| `xs` | `425px` | Smartphone (layar utama wali santri melihat riwayat bayar) |
| `sm` | `640px` | Phablet & smartphone lanskap |
| `md` | `768px` | Tablet portrait (iPad / tablet kasir loket sekolah) |
| `lg` | `1024px` | Laptop 13–14" staf tata usaha |
| `xl` | `1280px` | Desktop monitor standar admin |
| `2xl` | `1536px` | Monitor lebar ruang pimpinan yayasan |

---

## 7. Arsitektur Komponen Bersama & Primitif

Struktur komponen antarmuka dirancang modular dan konsisten di seluruh aplikasi:

```
components/
├── ui/                           # Komponen primitif antarmuka
│   ├── button.tsx                # Varian: default (emerald), gold, outline, ghost, destructive
│   ├── input.tsx                 # Input teks & angka dengan focus ring zamrud
│   ├── currency-input.tsx        # Input nominal Rupiah terformat otomatis (Rp 1.000.000)
│   ├── badge.tsx                 # Status pill semantik keuangan
│   ├── modal.tsx                 # Modal dialog umum
│   └── confirm-dialog.tsx        # Dialog konfirmasi aksi kritis
├── dashboard/                    # Komponen tata letak dashboard
│   ├── dashboard-shell.tsx       # Pembungkus responsif layar penuh
│   ├── dashboard-header.tsx      # Topbar, counter pending verifikasi, info user
│   ├── dashboard-sidebar.tsx     # Navigasi bertingkat berbasis peran (Admin vs Murid)
│   └── brand-mark.tsx            # Logo institusi dinamis + nama pesantren
├── spp/                          # Komponen spesifik modul SPP & Keuangan
│   ├── spp-month-selector.tsx    # Pemilih rentang bulan interaktif (1-12 bulan)
│   ├── spp-matrix-grid.tsx       # Matriks 12-bulan status pembayaran santri
│   ├── payment-verification-modal.tsx # Peninjau bukti transfer + tindakan approve/reject
│   ├── digital-receipt-card.tsx  # Kartu e-kuitansi digital shareable WhatsApp
│   └── expense-category-pill.tsx # Tag kategori pengeluaran operasional
└── shared/                       # Komponen kartu pembantu
    ├── page-header-card.tsx      # Header rute seragam dengan aksi utama
    ├── toolbar-card.tsx          # Filter tahun ajaran, pencarian murid, tombol export
    └── pagination-controls.tsx   # Paginasi tabel sisi server
```

### 7.1. Spesifikasi Tombol (Button Specs)

- **Ukuran Baku:**
  - `sm`: 32px (font 12px, padding horizontal 12px)
  - `default`: 38px (font 13px/14px, padding horizontal 16px)
  - `lg`: 44px (font 15px/16px, padding horizontal 20px)
- **Target Sentuh Mobile:** Minimal 44×44px agar ramah sentuhan jari tanpa salah tekan (*fat-finger friendly*).
- **Varian:**
  - `primary` (Emerald): Tombol simpan transaksi, konfirmasi approve, bayar sekarang.
  - `secondary` / `outline`: Filter, batal, kembali, tutup modal.
  - `gold`: Aksi kuitansi, kirim WA, lihat rincian cicilan.
  - `destructive` (Rose): Tolak pembayaran, hapus tagihan, batalkan transaksi.

### 7.2. Indikator Status Finansial (Badges)

| Status | Tampilan Badge | Nilai Semantik |
|---|---|---|
| **Lunas (Success)** | `bg-emerald-light text-emerald-primary border-emerald-primary/20` | Tagihan SPP atau non-SPP sudah lunas |
| **Menunggu Verifikasi (Pending)** | `bg-gold-bg text-gold-dark border-gold.accent/30 animate-pulse` | Murid sudah upload bukti, menunggu approve admin |
| **Cicilan (Partial)** | `bg-gold-bg text-gold-dark border-gold.accent/30` | Pembayaran sebagian yang disetujui |
| **Belum Bayar (Unpaid)** | `bg-rose-light text-rose-danger border-rose-danger/20` | Tagihan aktif belum dibayar |
| **Ditolak (Rejected)** | `bg-rose-light text-rose-danger border-rose-danger/20` | Bukti pembayaran ditolak admin dengan alasan |

---

## 8. Pola Form & Interaksi Pengguna (UX Patterns Berbasis PRD-V1)

Sesuai dengan ketentuan fungsional pada **PRD-V1**, pola interaksi diatur dengan skenario alur kerja nyata:

### 8.1. Alur Pembayaran SPP oleh Murid / Wali Santri

```
[1. Pilih Rentang Bulan] ──► [2. Hitung Nominal & Opsi Cicilan] ──► [3. Upload Bukti Transfer] ──► [Status: Pending]
```

1. **Pemilihan Rentang Bulan (1–12):**
   - Murid memilih rentang bulan (misal: Mulai *Juli* s/d Akhir *September*).
   - Sistem melakukan validasi otomatis: bulan yang sudah lunas tidak dapat dipilih kembali.
2. **Kalkulasi & Opsi Cicilan:**
   - Sistem menghitung total kewajiban secara otomatis berdasarkan tarif aktif di `spp_settings`.
   - Murid dapat memilih opsi cicilan (membayar sebagian dari total kewajiban jika diizinkan).
3. **Upload Bukti Pembayaran:**
   - Area drag-and-drop unggah file gambar struk ATM / tangkapan layar mobile banking.
   - Kolom isian keterangan tambahan opsional (misal: *"Transfer via BCA an. Ayah Santri"*).
4. **Konfirmasi & Notifikasi:**
   - Setelah dikirim, transaksi berstatus `pending` dan notifikasi sistem terkirim ke staf admin.

### 8.2. Alur Pembayaran Tagihan Non-SPP (Custom Bills)

- Menampilkan daftar tagihan aktif (misal: Kegiatan Santri, Kitab, Seragam).
- Mendukung pembayaran bertahap (cicilan) dengan aturan validasi minimal pembayaran: **minimal 10% dari sisa tagihan atau Rp 1.000**.
- Jika bukti pembayaran sebelumnya ditolak oleh admin, sistem menyediakan tombol **Upload Ulang Bukti** beserta informasi alasan penolakan dari admin.

### 8.3. Alur Verifikasi Pembayaran oleh Admin (Approve / Reject)

Halaman antrean pembayaran pending dirancang untuk verifikasi cepat:

```
┌────────────────────────────────────────────────────────┐
│ MODAL VERIFIKASI PEMBAYARAN PENDING                    │
├──────────────────────────┬─────────────────────────────┤
│ RINCIAN TRANSAKSI        │ PREVIEW BUKTI TRANSFER      │
│ • Santri: Ahmad Fauzi    │ [ Gambar Resolusi Tinggi ] │
│ • Jenis: SPP Juli-Agust  │ [ Fitur Zoom / Lightbox  ] │
│ • Nominal: Rp 700.000    │                             │
│ • Rekening Tujuan: BSI   │                             │
├──────────────────────────┴─────────────────────────────┤
│ AKSI:                                                  │
│ [x] Tolak (Wajib Catatan Alasan)  [✓] Setujui Pembayaran│
└────────────────────────────────────────────────────────┘
```

- **Setujui (Approve):**
  - Admin dapat memilih jenis pelunasan: `Lunas` atau `Cicilan`.
  - Sistem otomatis memperbarui status tagihan/SPP santri dan memicu status `accepted`.
- **Tolak (Reject):**
  - Admin wajib memasukkan catatan alasan penolakan (`alasan_reject`) sebelum konfirmasi.
  - Alasan ini akan langsung tampil di dashboard murid/wali santri agar mereka dapat mengunggah bukti yang benar.

### 8.4. Alur Pembayaran Manual Kasir (Admin Direct Cash)

- Admin loket dapat menginput pembayaran tunai langsung dari wali santri yang hadir di sekolah tanpa melalui tahap upload bukti.
- Transaksi langsung tersimpan dengan status `accepted` dan langsung menerbitkan kuitansi resmi.

### 8.5. Matriks Status SPP 12-Bulan (Yearly Overview Grid)

Pada profil murid dan dashboard rekap, status SPP tahun berjalan disajikan dalam grid 12 kotak bulan (Juli hingga Juni):

```
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ JUL  │ AGU  │ SEP  │ OKT  │ NOV  │ DES  │
│ LUNAS│ LUNAS│CICIL │BELUM │BELUM │BELUM │
├──────┼──────┼──────┼──────┼──────┼──────┤
│ JAN  │ FEB  │ MAR  │ APR  │ MEI  │ JUN  │
│BELUM │BELUM │BELUM │BELUM │BELUM │BELUM │
└──────┴──────┴──────┴──────┴──────┴──────┘
```

- Hijau: Lunas (*Paid*)
- Kuning: Sebagian (*Partial/Cicilan*) disertai info nominal terbayar & sisa
- Merah: Menunggak / Belum Bayar (*Unpaid*)
- Abu-abu: Belum masuk periode bulan penagihan

### 8.6. Manajemen Pengeluaran Operasional Pesantren

Modul kas keluar mencakup pencatatan biaya operasional sekolah dengan kategori baku:
1. Bayar Listrik
2. Sarapan Santri
3. Bayar WiFi / Internet
4. Kebutuhan Santri / Osman
5. Lainnya (*Other*)

Dashboard admin secara otomatis menghitung:
$$\text{Saldo Akhir} = \text{Total Pembayaran Masuk (SPP + Tagihan)} - \text{Total Pengeluaran}$$

---

## 9. Standar Desain Kuitansi & Dokumen Cetak

> [!IMPORTANT]
> **Ketentuan Khusus Format Kuitansi:**
> Kuitansi pembayaran **TIDAK MENGGUNAKAN** ukuran kertas full A4 agar efisien, modern, dan mudah dibagikan. Kuitansi menggunakan format **Slip Kuitansi Digital (e-Receipt Card)** dan slip cetak kompak yang siap dikirim via WhatsApp atau dicetak ringkas. Format kertas A4 hanya dikhususkan untuk **Laporan Rekapitulasi Keuangan Tahunan**.

### 9.1. Format e-Receipt / Slip Kuitansi Digital (Kompak & Shareable)

Kuitansi pembayaran dirancang berbentuk kartu slip elegan dengan proporsi proporsional:

```
┌────────────────────────────────────────────────────────┐
│             PESANTREN DIGITAL AR-RAHMAN                │
│         بسم الله الرحمن الرحيم                         │
│             KUITANSI PEMBAYARAN RESMI                  │
├────────────────────────────────────────────────────────┤
│ No. Kuitansi : KWT/2026/10/0142                        │
│ Tanggal      : 21 Oktober 2026, 14:30 WIB              │
│ Status       : LUNAS (Disetujui Panitia)               │
├────────────────────────────────────────────────────────┤
│ Nama Santri  : Muhammad Rayhan                         │
│ NIS/NIP      : 202609012                               │
│ Pembayaran   : SPP Periode Juli 2026 – Agustus 2026    │
│ Metode       : Transfer Bank BSI (Kasir Online)        │
├────────────────────────────────────────────────────────┤
│ JUMLAH TOTAL : Rp 700.000                              │
│ Terbilang    : Tujuh Ratus Ribu Rupiah                 │
├────────────────────────────────────────────────────────┤
│   [ QR Code ]        Tanda Tangan & Cap Digital:       │
│  HMAC Security       Bagian Keuangan Ar-Rahman         │
│  Verifikasi Sah      (Otomatis Diterbitkan Sistem)     │
├────────────────────────────────────────────────────────┤
│ [ Bagikan ke WhatsApp ]   [ Unduh Gambar / Slip PDF ]  │
└────────────────────────────────────────────────────────┘
```

**Elemen Wajib Slip Kuitansi:**
1. **Header Institusi:** Logo resolusi tinggi pesantren, nama yayasan, dan kaligrafi Basmalah (*Amiri font*).
2. **Nomor Kuitansi Unik:** Menggunakan format monospace tebal `KWT/{YYYY}/{MM}/{XXXX}`.
3. **Data Santri & Rincian Pembayaran:** Nama lengkap, NIS, alokasi bulan/jenis tagihan, metode bayar.
4. **Nominal & Terbilang:** Angka nominal besar dalam format rupiah disertai kalimat terbilang bahasa Indonesia resmi.
5. **Segel Keaslian Digital:** QR Code verifikasi berbasis token HMAC yang memvalidasi bahwa transaksi tercatat di database sekolah.
6. **Aksi Instan:** Tombol satu klik *"Kirim ke WhatsApp Wali Santri"* dan tombol cetak slip kasir.

### 9.2. Dokumen Rekap Laporan Keuangan (Format ISO A4 Landscape)

Khusus laporan berkala yang ditujukan kepada pimpinan yayasan:
- **Ukuran:** ISO A4 Landscape (297 × 210 mm).
- **Header:** Kop surat resmi lengkap Pesantren Ar-Rahman dengan garis pemisah ganda hijau zamrud dan emas.
- **Isi:** Tabel data rapi dengan nomor urut, NIS, nama santri, rincian pembayaran per bulan (Jan–Des), total penerimaan, dan status saldo.
- **Footer:** Tempat tanda tangan Kepala Pesantren dan Bendahara Keuangan.

---

## 10. Aturan Wajib Desain & Aksesibilitas

1. **Dynamic Branding Mandat:** Seluruh aset logo, favicon, nama pesantren, alamat, dan nomor kontak resmi wajib diambil secara dinamis dari database pengaturan sekolah (`SchoolSetting` / API backend). **Dilarang keras melakukan hardcode logo atau nama sekolah secara statis di template frontend.**
2. **Bebas Keterikatan Jenjang Kaku:** Desain antarmuka fleksibel dan tidak menampilkan batasan statis jenjang pendidikan tertentu, memastikan sistem dapat melayani seluruh santri Ar-Rahman secara menyeluruh.
3. **Standar Aksesibilitas Kontras (WCAG AA):** Teks gelap di atas kanvas `ivory` wajib memiliki rasio kontras minimal `4.5:1` untuk teks reguler dan `3:1` untuk judul besar. Dilarang mengandalkan warna semata tanpa teks atau ikon pendukung.
4. **Indikator Fokus Keyboard:** Semua kontrol input, tombol, dan link wajib memiliki focus ring zamrud yang tegas: `focus-visible:ring-2 focus-visible:ring-[#1A6B47] focus-visible:ring-offset-2`.
5. **Paginasi Sisi Server (Server-Side Pagination):** Seluruh tabel transaksi, data murid, tagihan, dan pengeluaran wajib menerapkan paginasi sisi server. Dilarang menampilkan data tak terhingga (*infinite vertical scrolling*) pada layar operasional keuangan.
6. **Pemisahan Desain Visual vs Aturan Sistem:** Dokumen `DESIGN.md` ini mengatur **ekspresi visual, identitas brand, dan interaksi pengguna**. Logika bisnis dan model database mengacu pada [PRD-v.1.md](PRD-v.1.md).

---

## 11. Migrasi Desain Penuh (100% PPDB Design Parity) & Profil Terpadu

Sistem telah menyelesaikan migrasi desain visual menyeluruh (100% parity) dari repositori **Project PPDB** (`apps/ppdb` dan `packages/ui`), membersihkan artefak Lovable, serta mengintegrasikan pengelolaan kata sandi langsung ke dalam halaman Profil:

### 11.1. Halaman Login (`/auth`) — Paritas Penuh CompanyProfile & Project PPDB
1. **Tata Letak Tunggal Terpusat (Single Centered Card):**
   - Mengadopsi arsitektur `AuthClient` dari `apps/companyprofile` (dan `apps/superadmin`): satu tampilan terpusat pada layar penuh (`min-h-dvh flex items-center justify-center relative overflow-hidden px-4 py-8`).
   - Tidak menggunakan split screen samping agar fokus pengguna murni tertuju pada kartu otentikasi yang proporsional dan ramping.
2. **Elemen Latar Belakang & Ornamen:**
   - Kanvas dasar warna gading (*Ivory* `var(--bg)` / `#F7F5F0`).
   - Lapisan gradasi halus: `bg-gradient-to-br from-[var(--accent-subtle)] via-transparent to-[var(--color-gold-subtle)] opacity-60`.
   - Pola titik geometris Islami halus (`.bg-pattern-dots` berukuran 24×24px dengan radial emerald opacity 0.35).
   - Cahaya latar ambient (*ambient blur orbs*) melayang: lingkaran emerald di sudut kanan-atas (`top-20 right-20 w-72 h-72 blur-3xl`) dan lingkaran emas di sudut kiri-bawah (`bottom-20 left-20 w-96 h-96 blur-3xl`).
3. **AuthCard & Komponen Form:**
   - Kartu terpusat dengan lebar ramping dan seimbang (`max-w-[22rem]`, `rounded-2xl`, border tipis elegan, `shadow-xl`).
   - Garis aksen gradasi 1px di bagian atas kartu: `linear-gradient(90deg, #1A6B47, #D4A853)`.
   - Logo dinamis via `useBrand(API_BASE)`.
   - Judul *"Selamat Datang"* (`DM Sans`) dan subjudul *"Sistem PTDARRAHMAN"*.
   - Badge pengenal resmi *"Akses Terbatas"* dengan ikon `ShieldCheck` emas (`#D4A853`) dan garis sayap emas halus (`color-mix`).
   - Input field berikon: `User` untuk Email / Username, `Lock` untuk Kata Sandi, dan tombol switch `Eye`/`EyeOff` untuk melihat sandi.
   - Tombol submit *"Masuk"* dengan spinner status memproses beranimasi, serta feedback status error responsif.
   - Tautan *"Lupa username/password?"* dengan animasi geser halus (*slide transition*) membuka formulir pemulihan akun `AuthRecoveryForm` di dalam kartu yang sama.

### 11.2. Halaman Profil Terpadu (`/profil`)
1. **Struktur Grid Dua Kolom:**
   - Mengadopsi arsitektur `ProfilePage` dari Project PPDB (`grid lg:grid-cols-[320px_1fr]`).
   - Bar navigasi atas dilengkapi tombol kembali berikon `ArrowLeft` dan judul *"Profile"*.
2. **Kartu Identitas Pengguna (Kolom Kiri):**
   - Komponen `AvatarEditor`: mendukung unggah foto dari perangkat (otomatis dikompresi ke WebP) maupun tautan URL gambar eksternal, dilengkapi inisial avatar dinamis.
   - Nama lengkap, username (`@username`), dan badge peran (`SUPERADMIN`, `ADMIN`, `ORANG TUA`) dengan varian warna sesuai hak akses.
   - Baris metadata: Username (`UserRound`), Email (`Mail`), Nomor WhatsApp (`Phone`), dan Status Akun (`BadgeCheck`).
3. **Seksi Informasi Profil & Keamanan (Kolom Kanan):**
   - **SectionCard 1 (Informasi Profile):** Aksen hijau primer (`bg-primary`), input Username (terkunci), Nama Lengkap, Email (akses khusus Superadmin), dan Nomor WhatsApp.
   - **SectionCard 2 (Ganti Password):** Aksen emas kemuliaan (`bg-gold-accent`), input Password Lama, Password Baru, dan Konfirmasi Password Baru.
   - Tombol aksi terpadu di bagian bawah: *"Batal"* dan *"Simpan Perubahan"* dengan indikator loading (`Loader2`).

### 11.3. Integrasi Ubah Sandi & Penghapusan Dialog Terpisah
- Fitur ganti kata sandi kini sepenuhnya menyatu di dalam halaman Profil (`/profil`).
- Tombol gembok terpisah di header dan modal dialog `PasswordDialog` telah dihapus dari `AppShell`, memastikan alur navigasi satu pintu yang bersih dan konsisten.

### 11.4. Pembersihan Artefak Lovable
- Seluruh artefak identitas, komentar template, berkas plan `.lovable/`, dan modul `lovable-error-reporting.ts` telah dibersihkan secara tuntas dari repositori.
- Hanya dependensi inti build pipeline (`@lovable.dev/vite-tanstack-config`) yang dipertahankan di `devDependencies` untuk menjaga kompatibilitas Nitro Cloudflare Workers build.

### 11.5. Paritas Penuh Komponen Dashboard (`@repo/ui` & `apps/ppdb` Project PPDB)
Komponen navigasi dashboard dan layout chrome disinkronkan 100% identik dengan paket `@repo/ui` (`packages/ui/src/components/dashboard/`) serta implementasi aplikasi nyata di `apps/ppdb` (`AdminLayout.tsx` & `AdminDashboardPage.tsx`) dan `apps/superadmin` (`Layout.tsx`):
1. **Sidebar (`DashboardSidebar`):**
   - Panel samping gradient putih kaca (`bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-xl border-r border-border/50`).
   - Dukungan drawer responsif pada mobile (`mobileOpen` dengan overlay backdrop blur hitam 50%) dan collapse ke icon-only pada desktop (`storageKey="ppdb_collapsed"`).
   - Indikator aktif vertikal emerald di sisi kiri menu (`activeBar`) dan state hover `hover:bg-primary/10`.
   - Menggunakan icon resmi `LayoutDashboard` dengan label `"Dashboard"` untuk beranda navigasi utama.
   - Tombol toggle collapse berbentuk lingkaran floating di batas kanan header sidebar dengan ikon chevron berputar 180°.
2. **Header Sidebar & BrandMark (`BrandMark`):**
   - Header sidebar menyajikan identitas brand dinamis: nama lembaga `"PTDARRAHMAN"`, indikator titik hijau emerald bercahaya (`bg-emerald-primary shadow-[0_0_4px_rgba(26,107,71,0.5)]`), dan subtitle dinamis (`SPP Admin · Semester ...`, `Superadmin`, atau `Portal Wali`).
   - `BrandMark`: menampilkan gambar logo/favicon resmi sekolah (`/logo.png` / `useBrand`), dan bila kosong menyediakan fallback monogram kaligrafi Arab `"ار"` (Ar-Rahman) di atas tile gradient emerald mewah (`bg-gradient-to-br from-primary to-[#145337]`).
3. **Header Utama Minimalis & Bersih (`DashboardHeader`):**
   - Bar navigasi atas sticky dengan latar belakang kaca putih transparan (`bg-white/70 backdrop-blur-xl border-b border-border h-14`).
   - Tombol burger menu untuk membuka navigasi di layar mobile (`md:hidden`).
   - Sesuai standar `apps/ppdb` dan `apps/superadmin`, bar atas dijaga tetap bersih tanpa duplikasi judul halaman (`title`), sehingga fokus visual pengguna langsung tertuju pada kartu judul halaman (`PageHeaderCard`) di area konten.
   - Kolom Semantic Search dengan shortcut keyboard `Ctrl+K` untuk pencarian instan seluruh menu dan fitur sistem.
   - Slot aksi kustom (`right` / `headerRight`) di samping dropdown menu profil.
4. **Dropdown Profile Menu (`DashboardProfileMenu`):**
   - Tombol pemicu (trigger) dengan avatar berlingkar ring emerald halus (`ring-1 ring-emerald-primary/20`), nama pengguna tebal, status dot hijau emerald, dan label hak akses (Role), dilengkapi chevron rotasi halus.
   - Kartu popup profil berbingkai gradien emerald halus (`border-emerald-primary/15 bg-gradient-to-br from-emerald-primary/10 to-emerald-primary/5 p-3`), avatar berlingkar ring putih, nama lengkap, email/username, dan pill badge role berikon dot emerald.
   - Menu aksi: item *"Lihat Profil"* berikon `User` emerald (mengarahkan langsung ke `/profil`), garis pemisah tipis, serta tombol *"Keluar"* berikon `LogOut` berwarna `text-rose-danger` dengan feedback hover merah halus (`showViewSite: false`).
5. **Dashboard Utama Admin (`/beranda` ala `AdminDashboardPage.tsx`):**
   - Diawali dengan kartu resmi `PageHeaderCard` (aksen vertikal zamrud-emas, tombol aksi rounded-full *"Buat Tagihan SPP"*, dan blok metrik: Semester Aktif, Status Kas Operasional dengan indikator ping emerald berkedip, serta Santri Terdaftar).
   - Deretan 4 kartu metrik `StatCard` (`Santri Aktif`, `Kas Masuk`, `Menunggu Verifikasi`, `Tagihan Belum Lunas`) berlatar belakang bubble lembut berbayang.
   - Bento Grid tingkat atas (2:1): grafik trend 6 bulan `GrowthChartCard` dan panel alert interaktif `AttentionCard`.
   - Baris distribusi bawah (3 kolom): `DonutCard` komposisi kas, `BreakdownCard` arus kas, dan `ActivityLogsCard` audit log staf.

### 11.6. Paritas Desain UI Seluruh Halaman Operasional (100% Parity with Project PPDB)
Seluruh halaman antarmuka operasional telah dirender ulang mengadopsi standar visual, tata letak, komponen toolbar, kartu metrik, dan tabel data yang sama persis dengan `project-ppdb` (`apps/ppdb` dan `apps/superadmin`):
1. **Kuitansi Publik & Admin (`/kuitansi/$nomor`):**
   - Mengadopsi komponen `OfficialReceiptCard` resmi berheader gradasi zamrud pekat (`bg-emerald-950 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950`), watermark `ShieldCheck` perisai islami, rincian pembayaran, QR code verifikasi instan, serta toolbar aksi di bagian atas (Kembali, Cetak Slip, Bagikan WhatsApp, dan Salin Link).
2. **Manajemen Tagihan (`/tagihan`):**
   - Mengadopsi arsitektur `DataPendaftarPage` & `PembayaranFormulirPage`: kartu ringkasan `PageHeaderCard` (Total Tagihan, Belum Lunas, Lunas, Total Nilai), pill filter status (`Semua`, `Belum Bayar`, `Cicilan`, `Lunas`, `Dibatalkan`), pill filter jenis (`Semua`, `SPP`, `Non-SPP`, `Event`), `ToolbarCard` terintegrasi tombol aksi *"Tagihan Non-SPP"*, tabel data berheader `bg-emerald-primary/5 text-[11px] font-bold uppercase`, progres bar cicilan, dan badge status berseri dot warna.
3. **Monitoring Pembayaran (`/pembayaran`):**
   - Mengadopsi tata letak `PembayaranFormulirPage` 1:1: `PageHeaderCard` (Total Transaksi, Perlu Verifikasi dengan pulse indicator, Dikonfirmasi Sah, Penerimaan Terverifikasi), pill status filter, `ToolbarCard` dengan aksi *"Catat Pembayaran"*, tabel transaksi lengkap (No. Kuitansi, Santri, Nominal + Infaq, Metode, Status Badge, Bukti Transfer preview button, dan Aksi Konfirmasi/Tolak/Batal/Kuitansi).
4. **Data Wali Murid (`/orang-tua`):**
   - Mengadopsi tata letak `UsersPage`: `PageHeaderCard` metrik wali terdaftar & akun login, `ToolbarCard` pencarian terpadu, tabel data (Avatar inisial, username `@wali`, kontak WhatsApp/email, pill badges santri terhubung dengan tombol unlink `X`, status akun login tersambung/belum, dan aksi tautkan akun / hapus).
5. **Pengeluaran Operasional (`/pengeluaran`):**
   - Mengadopsi tabel akuntansi PPDB: `PageHeaderCard` beban kas, catatan pembukuan, kategori pengeluaran, `ToolbarCard` dengan filter dropdown kategori, tabel pengeluaran (Keperluan, Kategori Badge, Tanggal, Nominal minus merah `-Rp`, dan tombol hapus).
6. **Event & Kegiatan Santri (`/event`):**
   - Mengadopsi kartu gelombang PPDB: `PageHeaderCard` ringkasan dana kegiatan, `ToolbarCard`, grid kartu modern beranimasi hover dengan progress bar pelunasan santri, target nominal, badge jumlah peserta, batas waktu deadline, dan link cepat ke rincian tagihan.
7. **Data & Detail Siswa (`/siswa` dan `/siswa/$studentId`):**
   - Tabel santri dengan header `bg-emerald-primary/5`, badge status berindikator dot (`Aktif` hijau, `Alumni` biru, `Nonaktif` abu-abu), avatar inisial, dan rincian profil dua semester (Ganjil & Genap) 12 bulan peta status SPP.
8. **Kelola Pengguna & Laporan Keuangan (`/pengguna` dan `/laporan`):**
   - Tabel pengguna staf bergaya superadmin PPDB dengan pill badge peran (`Superadmin` ungu, `Admin` emerald), dialog modal modern, dan laporan keuangan terpadu dengan kartu metrik statistik, diagram donat, breakdown pos anggaran, serta cetak langsung.

---

<div align="center">
  <i>Pedoman Desain Resmi — Pesantren Tahfidz Qur'an dan Digital Ar-Rahman</i>
</div>
