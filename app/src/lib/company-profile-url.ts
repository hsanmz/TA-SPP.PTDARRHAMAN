/**
 * Base URL situs publik (company profile), untuk action "Lihat Situs" di
 * dashboard.
 * Ported dari packages/ui/src/lib/company-profile-url.ts.
 */
export function resolveCompanyProfileUrl(configured?: string): string {
  if (configured) return configured.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname.includes("ptdarrahman.sch.id")) return "https://ptdarrahman.sch.id";
    return `${protocol}//${hostname}:3000`;
  }

  return "http://localhost:3000";
}
