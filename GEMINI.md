# GEMINI & Agent Rules: Pesantren Ar-Rahman SPP System

## Aturan Utama
1. **Wajib Selalu Perbarui Dokumentasi**: Setiap sesi atau pekerjaan yang mengubah kode (fitur baru, perbaikan bug, refactor, skema database, env) WAJIB memperbarui dokumentasi terkait (`README.md`, `app/README.md`, `DESIGN.md`, `PRD-v2.md`, atau `.docs/`).
2. **Arsitektur DB**:
   - Turso (`libsql://payptd-hsanmz.aws-ap-southeast-1.turso.io`) adalah basis data relasional utama untuk Drizzle ORM.
   - Cloudflare D1 (`DB_STORAGE`, ID `bcf1d253-7f8a-4669-b399-05d06127240f`) adalah basis data penyimpanan bukti pembayaran di edge Cloudflare Workers.
   - Local DB adalah SQLite `app/data/ta-spp.db`.
3. **Dokumen Skripsi (.docs/)**:
   - `LAPORAN TA.docx` adalah dokumen induk. Format margin 4cm, Arial 12pt, spasi 1.5, penomoran heading `BAB %1`.
   - Basis data di naskah skripsi ditulis secara konsisten sebagai SQLite / Cloudflare D1.
   - Sinkronisasi naskah utama dan naskah per bab harus selalu terjaga.
