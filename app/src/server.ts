import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { generateSppForPeriod } from "./lib/backend/spp";
import { setServerEnv, type D1DatabaseLike } from "./lib/storage";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

async function handleCronRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/cron/generate-spp") return null;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed. Use POST.", { status: 405 });
  }

  // Verifikasi CRON_SECRET jika dikonfigurasi
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = request.headers.get("authorization");
  const secretHeader = request.headers.get("x-cron-secret");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const providedSecret = bearerToken || secretHeader;

  if (cronSecret && providedSecret !== cronSecret) {
    return new Response("Unauthorized: Invalid CRON_SECRET", { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    year?: unknown;
    month?: unknown;
  } | null;
  const now = new Date();
  const rawYear = Number(body?.year);
  const rawMonth = Number(body?.month);
  const year = rawYear >= 2000 && rawYear <= 2100 ? rawYear : now.getFullYear();
  const month = rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1;

  const generated = await generateSppForPeriod(year, month);
  console.log(`[cron:generate-spp] ${generated} tagihan SPP dibuat untuk ${year}-${month}`);
  return Response.json({ ok: true, year, month, generated });
}

async function handleProofRequest(request: Request, env: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/proofs/")) return null;

  const id = url.pathname.replace("/api/proofs/", "").split("/")[0]?.trim();
  if (!id) return new Response("Bad Request: ID required", { status: 400 });

  const d1 = (env as Record<string, unknown> | undefined)?.["DB_STORAGE"] as D1DatabaseLike | undefined;
  if (!d1 || typeof d1.prepare !== "function") {
    return new Response("Storage D1 belum terkonfigurasi", { status: 503 });
  }

  try {
    const row = await d1
      .prepare("SELECT mime_type, image_data FROM payment_proofs WHERE id = ?")
      .bind(id)
      .first<{ mime_type: string; image_data: string }>();

    if (!row || !row.image_data) {
      return new Response("Gambar bukti bayar tidak ditemukan", { status: 404 });
    }

    const commaIdx = row.image_data.indexOf(",");
    const mime =
      (commaIdx > -1 && row.image_data.startsWith("data:")
        ? row.image_data.slice(5, commaIdx).split(";")[0]
        : row.mime_type) || "image/webp";

    const base64Str = commaIdx > -1 ? row.image_data.slice(commaIdx + 1) : row.image_data;
    const binary = atob(base64Str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[proofs] gagal mengambil dari D1:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      setServerEnv(env);

      const proofResponse = await handleProofRequest(request, env);
      if (proofResponse) return proofResponse;

      const cronResponse = await handleCronRequest(request);
      if (cronResponse) return cronResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
