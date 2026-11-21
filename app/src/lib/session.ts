const KEY = "spp.session.token";
const EVENT = "spp:session-change";

function hasStorage(): boolean {
  return typeof localStorage !== "undefined";
}

export function getToken(): string | null {
  if (!hasStorage()) return null;
  return localStorage.getItem(KEY);
}

export function setToken(token: string | null): void {
  if (!hasStorage()) return;
  if (token) localStorage.setItem(KEY, token);
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function onSessionChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
