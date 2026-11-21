import { createFileRoute, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/session";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    const token = getToken();
    if (token) {
      throw redirect({ to: "/beranda" });
    }
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
