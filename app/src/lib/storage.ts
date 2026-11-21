let globalEnv: Record<string, unknown> | undefined;

export function setServerEnv(env: unknown) {
  if (env && typeof env === "object") {
    globalEnv = env as Record<string, unknown>;
  }
}

export function getServerEnv(): Record<string, unknown> | undefined {
  return globalEnv;
}

export interface D1DatabaseLike {
  prepare: (query: string) => {
    bind: (...args: unknown[]) => {
      run: () => Promise<unknown>;
      first: <T>() => Promise<T | null>;
      all: <T>() => Promise<{ results: T[] }>;
    };
  };
}

export function getD1Storage(): D1DatabaseLike | null {
  const env = getServerEnv();
  const d1 = (env?.["DB_STORAGE"] ?? (globalThis as unknown as Record<string, unknown>)["DB_STORAGE"]) as D1DatabaseLike | undefined;
  if (d1 && typeof d1.prepare === "function") {
    return d1;
  }
  return null;
}

/**
 * Menyimpan data bukti pembayaran ke Cloudflare D1 (jika binding DB_STORAGE tersedia).
 * Jika D1 belum terhubung (misal saat run dev lokal), mengembalikan dataUrl langsung sebagai fallback.
 * Mengembalikan relative URL: "/api/proofs/{id}" atau dataUrl.
 */
export async function persistProof(dataUrlOrUrl: string | null | undefined): Promise<string | null> {
  if (!dataUrlOrUrl) return null;
  // Jika sudah berupa URL biasa, tidak perlu diapa-apakan
  if (!dataUrlOrUrl.startsWith("data:image/")) {
    return dataUrlOrUrl;
  }

  const d1 = getD1Storage();
  if (!d1) {
    // Fallback lokal (saat tidak running di worker D1)
    return dataUrlOrUrl;
  }

  try {
    const id = crypto.randomUUID();
    const mimeMatch = dataUrlOrUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/webp";

    await d1
      .prepare(
        "INSERT INTO payment_proofs (id, mime_type, image_data, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(id, mime, dataUrlOrUrl, Date.now())
      .run();

    return `/api/proofs/${id}`;
  } catch (err) {
    console.error("[storage] gagal menyimpan ke D1:", err);
    // Jika gagal insert ke D1, fallback simpan dataUrl agar pembayaran tidak gagal
    return dataUrlOrUrl;
  }
}
