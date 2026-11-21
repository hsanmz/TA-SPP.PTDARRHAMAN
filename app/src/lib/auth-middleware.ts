import { createMiddleware } from "@tanstack/react-start";
import { getToken } from "@/lib/session";

/**
 * Global function middleware to attach the bearer token from the client session
 * to serverFn RPC requests.
 */
export const attachAuthHeader = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = getToken();
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
