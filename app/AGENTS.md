# Pedoman Pengembangan & Aturan Kerja Agen AI (App Level)

> **PENTING**: Dokumen ini merupakan turunan langsung dari `../AGENTS.md`.

## ⚠️ Aturan Wajib Pembaruan Dokumentasi
Setiap kali melakukan perubahan kode, komponen, server functions, skema basis data, atau environment:
1. Dokumentasi di `README.md`, `../README.md`, `../DESIGN.md`, `../PRD-v2.md`, dan/atau `.docs/` WAJIB langsung diperbarui.
2. Tidak boleh ada disparitas antara implementasi kode dengan dokumen teknis/skripsi.

## 🏛️ Konfigurasi Basis Data
- **Primary Relational DB**: Turso LibSQL (`DATABASE_URL` & `DATABASE_AUTH_TOKEN`) via Drizzle ORM.
- **Media/Proof Storage DB**: Cloudflare D1 (`DB_STORAGE`, ID `bcf1d253-7f8a-4669-b399-05d06127240f`) via `wrangler.json`.
- **Local Fallback**: `data/ta-spp.db`.
