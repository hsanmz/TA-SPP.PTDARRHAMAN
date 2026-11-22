const KEY = "spp.session.token";
const COOKIE_KEY = "spp_session";
const EVENT = "spp:session-change";

function hasStorage(): boolean {
  return typeof localStorage !== "undefined";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string | null): void {
  if (typeof document === "undefined") return;
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 3600}`;
  } else {
    document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0`;
  }
}

export function getToken(): string | null {
  if (hasStorage()) {
    try {
      const token = localStorage.getItem(KEY);
      if (token) return token;
    } catch {
      // LocalStorage access restricted
    }
  }
  return getCookie(COOKIE_KEY);
}

export function setToken(token: string | null): void {
  if (hasStorage()) {
    try {
      if (token) localStorage.setItem(KEY, token);
      else localStorage.removeItem(KEY);
    } catch {
      // LocalStorage access restricted
    }
  }
  setCookie(COOKIE_KEY, token);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function onSessionChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
