import type { ComponentType } from "react";
import type { DashboardNavGroup, DashboardNavItem } from "../types";

export interface SemanticSearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category:
    | "Navigasi"
    | "Aksi"
    | "Pendaftar"
    | "Pengguna"
    | "Konten"
    | "Fasilitas"
    | "Pengajar"
    | "Program"
    | "Prestasi"
    | "Panduan"
    | "Lainnya";
  icon?: string | ComponentType<{ className?: string }>;
  badge?: string;
  url?: string;
  onClick?: () => void;
  score?: number;
  keywords?: string[];
  intentGroup?: string;
}

// ── Ontologi Konsep & Sinonim Semantik (Kamus Domain Pesantren & SPP) ───────
export const SEMANTIC_ONTOLOGY: Record<string, string[]> = {
  santri: ["siswa", "murid", "anak", "pelajar", "biodata", "nis", "kelas", "angkatan"],
  siswa: ["santri", "murid", "anak", "pelajar", "biodata", "nis", "kelas"],
  wali: ["orang tua", "wali santri", "wali murid", "kontak wali", "telepon", "keluarga"],
  tagihan: ["invoice", "spp", "non spp", "biaya", "tunggakan", "tarif", "piutang"],
  bayar: [
    "pembayaran",
    "keuangan",
    "biaya",
    "tagihan",
    "spp",
    "qris",
    "transfer",
    "lunas",
    "transaksi",
    "cicilan",
    "kuitansi",
    "verifikasi",
  ],
  spp: ["iuran", "bulanan", "biaya bulanan", "tagihan spp", "generate spp"],
  event: ["kegiatan", "rihlah", "studi banding", "biaya event", "cicilan event"],
  pengeluaran: ["beban", "operasional", "kas keluar", "biaya operasional", "belanja"],
  laporan: ["rekapitulasi", "tunggakan", "rekap", "buku kas", "neraca", "ekspor", "keuangan"],
  pengguna: [
    "user",
    "akun",
    "admin",
    "petugas",
    "operator",
    "password",
    "superadmin",
    "ganti sandi",
  ],
  pengaturan: [
    "setting",
    "konfigurasi",
    "rekening",
    "bank",
    "qris",
    "tahun ajaran",
    "profil",
    "sekolah",
  ],
};

// ── Tag Semantik Khusus untuk Rute SPP Pesantren ─────────────────────────────
export const ROUTE_SEMANTIC_TAGS: Record<
  string,
  { category: SemanticSearchItem["category"]; keywords: string[]; desc: string }
> = {
  "/beranda": {
    category: "Navigasi",
    keywords: [
      "beranda",
      "dashboard",
      "ringkasan",
      "overview",
      "statistik",
      "keuangan",
      "tunggakan",
      "grafik",
      "metrik",
    ],
    desc: "Ringkasan statistik keuangan SPP, status santri, dan ikhtisar kas",
  },
  "/siswa": {
    category: "Navigasi",
    keywords: [
      "siswa",
      "santri",
      "murid",
      "anak",
      "data santri",
      "nis",
      "kelas",
      "angkatan",
      "status aktif",
      "tambah siswa",
      "biodata",
    ],
    desc: "Kelola data santri, NIS, kelas, riwayat tagihan, dan status santri",
  },
  "/orang-tua": {
    category: "Navigasi",
    keywords: [
      "wali murid",
      "orang tua",
      "wali santri",
      "kontak wali",
      "telepon",
      "akun wali",
      "hubungan keluarga",
    ],
    desc: "Kelola data wali santri dan penautan akun dengan santri",
  },
  "/tagihan": {
    category: "Navigasi",
    keywords: [
      "tagihan",
      "invoice",
      "spp",
      "non spp",
      "biaya",
      "buat tagihan",
      "generate spp",
      "cicilan",
      "status tagihan",
    ],
    desc: "Daftar tagihan SPP bulanan & non-SPP, buat tagihan, dan monitoring pelunasan",
  },
  "/pembayaran": {
    category: "Navigasi",
    keywords: [
      "pembayaran",
      "transaksi",
      "verifikasi",
      "konfirmasi",
      "bukti bayar",
      "transfer",
      "qris",
      "kuitansi",
      "tolak pembayaran",
    ],
    desc: "Verifikasi bukti pembayaran masuk, pencatatan manual, dan kuitansi",
  },
  "/event": {
    category: "Navigasi",
    keywords: [
      "event",
      "kegiatan",
      "rihlah",
      "studi banding",
      "biaya event",
      "cicilan event",
      "kegiatan santri",
    ],
    desc: "Kelola kegiatan pesantren, biaya terprogram, dan skema cicilan event",
  },
  "/pengeluaran": {
    category: "Navigasi",
    keywords: [
      "pengeluaran",
      "beban",
      "operasional",
      "biaya keluar",
      "catat pengeluaran",
      "kategori pengeluaran",
      "kas keluar",
    ],
    desc: "Pencatatan pengeluaran operasional pesantren dan arus kas keluar",
  },
  "/laporan": {
    category: "Navigasi",
    keywords: [
      "laporan",
      "rekapitulasi",
      "tunggakan",
      "rekap spp",
      "buku kas",
      "ekspor excel",
      "pdf",
      "neraca",
      "laporan keuangan",
    ],
    desc: "Laporan rekapitulasi pembayaran SPP, daftar tunggakan, dan arus kas",
  },
  "/pengaturan": {
    category: "Navigasi",
    keywords: [
      "pengaturan",
      "setting",
      "tarif spp",
      "rekening bank",
      "qris",
      "tahun ajaran",
      "profil pesantren",
      "identitas",
    ],
    desc: "Konfigurasi tarif SPP per kelas/angkatan, rekening tujuan, dan profil madrasah",
  },
  "/pengguna": {
    category: "Navigasi",
    keywords: [
      "pengguna",
      "user",
      "admin",
      "superadmin",
      "akun",
      "kelola user",
      "tambah akun",
      "ganti password",
    ],
    desc: "Manajemen akun staf pengelola, admin sekolah, dan superadmin",
  },
  "/profil": {
    category: "Navigasi",
    keywords: [
      "profil",
      "biodata",
      "ganti sandi",
      "keamanan",
      "avatar",
      "kata sandi",
      "ubah profile",
    ],
    desc: "Pengaturan akun pribadi, ubah kata sandi, dan informasi identitas",
  },
};

// ── Vektorisasi & Cosine Similarity Math ─────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function expandQueryTokens(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    for (const [concept, syns] of Object.entries(SEMANTIC_ONTOLOGY)) {
      if (token === concept || syns.includes(token)) {
        expanded.add(concept);
        for (const s of syns) expanded.add(s);
      }
    }
  }
  return Array.from(expanded);
}

function computeTermFrequencies(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) || 0) + 1);
  }
  return map;
}

function cosineSimilarity(tf1: Map<string, number>, tf2: Map<string, number>): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const val of tf1.values()) norm1 += val * val;
  for (const val of tf2.values()) norm2 += val * val;

  if (norm1 === 0 || norm2 === 0) return 0;

  for (const [term, freq1] of tf1.entries()) {
    const freq2 = tf2.get(term) || 0;
    dotProduct += freq1 * freq2;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));
  for (let i = 0; i <= bn; i++) {
    const row = matrix[i]!;
    row[0] = i;
  }
  for (let j = 0; j <= an; j++) {
    const row0 = matrix[0]!;
    row0[j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    const row = matrix[i]!;
    const prevRow = matrix[i - 1]!;
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        row[j] = prevRow[j - 1] ?? 0;
      } else {
        row[j] = Math.min(
          (prevRow[j - 1] ?? 0) + 1,
          Math.min((row[j - 1] ?? 0) + 1, (prevRow[j] ?? 0) + 1),
        );
      }
    }
  }
  const lastRow = matrix[bn]!;
  return lastRow[an] ?? 0;
}

function fuzzyMatch(token: string, targetWords: string[]): boolean {
  if (token.length < 3) return false;
  for (const word of targetWords) {
    if (word.length < 3) continue;
    const maxDist = token.length <= 4 ? 1 : 2;
    if (levenshtein(token, word) <= maxDist) return true;
  }
  return false;
}

// ── Bangun Index Katalog Navigasi & Aksi Lokal ────────────────────────────────

export function buildLocalSemanticIndex(navGroups: DashboardNavGroup[]): SemanticSearchItem[] {
  const items: SemanticSearchItem[] = [];
  const seenUrls = new Set<string>();

  function processItem(item: DashboardNavItem, groupLabel?: string) {
    const targetUrl = item.href || item.key;
    if (!targetUrl || seenUrls.has(targetUrl)) return;
    seenUrls.add(targetUrl);

    const meta = ROUTE_SEMANTIC_TAGS[targetUrl] || {
      category: "Navigasi",
      keywords: [],
      desc: groupLabel ? `Bagian menu ${groupLabel}` : "Menu navigasi dashboard",
    };

    const keywords = [
      ...tokenize(item.label),
      ...meta.keywords,
      ...(groupLabel ? tokenize(groupLabel) : []),
    ];

    items.push({
      id: `nav-${item.key || targetUrl}`,
      title: item.label,
      subtitle: meta.desc,
      category: meta.category,
      icon: item.icon,
      url: item.href,
      onClick: item.onClick,
      keywords,
    });

    if (item.children) {
      for (const child of item.children) {
        processItem(child, item.label);
      }
    }
  }

  for (const group of navGroups) {
    for (const item of group.items) {
      processItem(item, group.label);
    }
  }

  // Tambahkan aksi cepat umum jika relevan
  items.push(
    {
      id: "action-new-student",
      title: "Tambah Santri Baru",
      subtitle: "Buka formulir pendaftaran santri baru atau kelola data kelas",
      category: "Aksi",
      url: "/siswa",
      keywords: ["tambah santri", "tambah siswa", "santri baru", "input nis"],
    },
    {
      id: "action-new-invoice",
      title: "Buat Tagihan Baru",
      subtitle: "Buat tagihan non-SPP atau terbitkan tagihan santri",
      category: "Aksi",
      url: "/tagihan",
      keywords: ["buat tagihan", "tagihan baru", "invoice baru", "tagihan non spp"],
    },
    {
      id: "action-verify-payment",
      title: "Verifikasi Pembayaran",
      subtitle: "Periksa bukti transfer dan konfirmasi pembayaran pending",
      category: "Aksi",
      url: "/pembayaran",
      keywords: ["verifikasi pembayaran", "konfirmasi transfer", "bukti bayar", "approve payment"],
    },
    {
      id: "action-record-expense",
      title: "Catat Pengeluaran",
      subtitle: "Catat transaksi beban operasional pesantren baru",
      category: "Aksi",
      url: "/pengeluaran",
      keywords: ["catat pengeluaran", "tambah beban", "kas keluar", "pengeluaran baru"],
    },
    {
      id: "action-view-arrears",
      title: "Rekap Laporan & Tunggakan",
      subtitle: "Buka laporan daftar santri yang memiliki tunggakan SPP",
      category: "Aksi",
      url: "/laporan",
      keywords: ["tunggakan", "rekap tunggakan", "belum bayar", "laporan keuangan"],
    },
    {
      id: "action-new-user",
      title: "Tambah Pengguna Baru",
      subtitle: "Buka manajemen akun admin, pengelola, atau superadmin",
      category: "Aksi",
      url: "/pengguna",
      keywords: ["tambah user", "buat akun", "admin baru", "kelola pengguna"],
    },
  );

  return items;
}

// ── Semantic Search Algorithm ────────────────────────────────────────────────

export function searchSemanticCatalog(
  query: string,
  catalog: SemanticSearchItem[],
): SemanticSearchItem[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const queryTokens = tokenize(cleanQ);
  const expandedTokens = expandQueryTokens(queryTokens);
  const queryTf = computeTermFrequencies(expandedTokens);

  const scored: SemanticSearchItem[] = [];

  for (const item of catalog) {
    const itemTokens = [
      ...tokenize(item.title),
      ...(item.subtitle ? tokenize(item.subtitle) : []),
      ...(item.keywords || []),
      item.category.toLowerCase(),
    ];

    const itemTf = computeTermFrequencies(itemTokens);
    const cosScore = cosineSimilarity(queryTf, itemTf);

    let boost = 0;
    const lowerTitle = item.title.toLowerCase();
    const lowerSub = (item.subtitle || "").toLowerCase();

    // Exact phrase match boost
    if (lowerTitle.includes(cleanQ)) {
      boost += 0.4;
    } else if (lowerSub.includes(cleanQ)) {
      boost += 0.25;
    }

    // Token startswith boost
    for (const qTok of queryTokens) {
      if (itemTokens.some((t) => t.startsWith(qTok))) {
        boost += 0.15;
      }
    }

    // Typo tolerance fuzzy match
    for (const qTok of queryTokens) {
      if (fuzzyMatch(qTok, itemTokens)) {
        boost += 0.1;
      }
    }

    const finalScore = Math.min(cosScore + boost, 1.0);

    if (finalScore >= 0.25) {
      scored.push({
        ...item,
        score: Math.round(finalScore * 100),
      });
    }
  }

  // Sort by score descending
  return scored.sort((a, b) => (b.score || 0) - (a.score || 0));
}

// ── Fetch Server-Side Live Semantic Data ─────────────────────────────────────

export async function fetchLiveSemanticResults(
  query: string,
  apiBase = "",
): Promise<SemanticSearchItem[]> {
  const cleanQ = query.trim();
  if (cleanQ.length < 2) return [];

  const baseUrl = apiBase.replace(/\/+$/, "");
  const endpoint = `${baseUrl}/search/semantic?q=${encodeURIComponent(cleanQ)}&limit=15`;

  try {
    const res = await fetch(endpoint, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !Array.isArray(data.results)) return [];

    return data.results.map((r: Record<string, unknown>): SemanticSearchItem => ({
      id: typeof r["id"] === "string" ? r["id"] : String(Math.random()),
      title: typeof r["title"] === "string" ? r["title"] : "Tanpa Judul",
      subtitle: typeof r["subtitle"] === "string" ? r["subtitle"] : "",
      category:
        typeof r["category"] === "string"
          ? (r["category"] as SemanticSearchItem["category"])
          : "Lainnya",
      badge: typeof r["badge"] === "string" ? r["badge"] : undefined,
      url: typeof r["url"] === "string" ? r["url"] : undefined,
      score: typeof r["score"] === "number" ? Math.round(r["score"] * 100) : 80,
    }));
  } catch {
    return [];
  }
}
