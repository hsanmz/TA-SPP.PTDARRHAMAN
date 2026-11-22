# GEMINI & Agent Rules: Pesantren Ar-Rahman SPP System

## Aturan Utama
1. **Wajib Selalu Perbarui Dokumentasi**: Setiap sesi atau pekerjaan yang mengubah kode (fitur baru, perbaikan bug, refactor, skema database, env) WAJIB memperbarui dokumentasi terkait (`README.md`, `app/README.md`, `DESIGN.md`, `PRD-v2.md`, atau `.docs/`).
2. **Arsitektur DB**:
   - Cloudflare D1 (`payptd`, ID `bcf1d253-7f8a-4669-b399-05d06127240f`, binding `DB` & `DB_STORAGE`) adalah basis data utama produksi untuk Drizzle ORM (Turso telah sepenuhnya dihapus).
   - Local DB adalah SQLite `app/data/ta-spp.db` (zero remote network dependency).
3. **Dokumen Skripsi (.docs/)**:
   - `LAPORAN TA.docx` adalah dokumen induk. Format margin 4cm, Arial 12pt, spasi 1.5, penomoran heading `BAB %1`.
   - Basis data di naskah skripsi ditulis secara konsisten sebagai SQLite / Cloudflare D1.
   - Sinkronisasi naskah utama dan naskah per bab harus selalu terjaga.
