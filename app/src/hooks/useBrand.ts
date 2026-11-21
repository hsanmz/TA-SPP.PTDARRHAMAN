import { useEffect, useMemo, useState } from "react";

/**
 * Pola branding dinamis (logo + favicon) sesuai aturan monorepo:
 * - Ambil logo & favicon dari GET /companyprofile/settings/{key}.
 * - Perubahan brand di-notify via SSE /companyprofile/events event "change".
 *
 * EventSource dibuat SATU per app (module singleton) dan di-share oleh semua
 * pemakai hook — bukan satu koneksi per komponen.
 */
export interface BrandAssets {
  logoUrl: string;
  faviconUrl: string;
}

const listeners = new Set<() => void>();
let sharedSource: EventSource | null = null;
let sharedBase = "";

function notify() {
  for (const fn of listeners) fn();
}

function stopSharedSource() {
  if (sharedSource) {
    sharedSource.close();
    sharedSource = null;
    sharedBase = "";
  }
}

function ensureSharedSource(base: string) {
  if (sharedSource && sharedBase === base) return;
  stopSharedSource();
  sharedBase = base;
  if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
    try {
      sharedSource = new EventSource(`${base}/companyprofile/events`);
      sharedSource.addEventListener("change", notify);
    } catch {
      // Abaikan bila SSE gagal terhubung (offline/local fallback)
    }
  }
}

export function useBrand(apiBase?: string): BrandAssets {
  const serviceUrl = useMemo(() => (apiBase || "").replace(/\/+$/, ""), [apiBase]);
  const [assets, setAssets] = useState<BrandAssets>({ logoUrl: "", faviconUrl: "" });

  useEffect(() => {
    if (!serviceUrl) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [logoRes, faviconRes] = await Promise.all([
          fetch(`${serviceUrl}/companyprofile/settings/logo`).catch(() => null),
          fetch(`${serviceUrl}/companyprofile/settings/favicon`).catch(() => null),
        ]);
        const [logo, favicon] = await Promise.all([
          logoRes && logoRes.ok ? logoRes.json().catch(() => null) : null,
          faviconRes && faviconRes.ok ? faviconRes.json().catch(() => null) : null,
        ]);
        if (cancelled) return;
        setAssets((prev) => ({
          logoUrl: logo?.value ? String(logo.value) : prev.logoUrl,
          faviconUrl: favicon?.value ? String(favicon.value) : prev.faviconUrl,
        }));
      } catch {
        // Gagal jaringan/parse tidak fatal — pertahankan nilai lama.
      }
    };

    load();
    ensureSharedSource(serviceUrl);
    listeners.add(load);

    return () => {
      cancelled = true;
      listeners.delete(load);
      if (listeners.size === 0) stopSharedSource();
    };
  }, [serviceUrl]);

  return assets;
}
