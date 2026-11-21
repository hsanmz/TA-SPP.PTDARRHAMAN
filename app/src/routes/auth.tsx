import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { login } from "@/lib/auth-functions";
import { getToken, setToken } from "@/lib/session";
import { AuthCard } from "@/components/ui/auth-card";
import { useBrand } from "@/hooks/useBrand";
import { API_BASE } from "@/api/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk - Sistem PTDARRAHMAN" },
      {
        name: "description",
        content: "Masuk untuk mengakses sistem informasi dan administrasi.",
      },
      { property: "og:title", content: "Masuk - Sistem PTDARRAHMAN" },
      {
        property: "og:description",
        content: "Masuk untuk mengakses sistem informasi dan administrasi.",
      },
    ],
  }),
  component: LoginPage,
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");

  // Logo dinamis via useBrand (GET /companyprofile/settings/logo + live SSE).
  const { logoUrl } = useBrand(API_BASE);

  useEffect(() => {
    if (getToken()) {
      void navigate({ to: "/beranda" });
    }
  }, [navigate]);

  const handleLogin = async (username: string, password: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await login({ data: { username: username.trim().toLowerCase(), password } });
      setToken(result.token);
      setSuccessName(result.user.full_name || username);
      setSuccess(true);
      setTimeout(() => void navigate({ to: "/beranda" }), 500);
    } catch (err: unknown) {
      setSuccess(false);
      const msg = err instanceof Error ? err.message : "Login gagal";
      setError(msg || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] relative overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent-subtle)] via-transparent to-[var(--color-gold-subtle)] opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-pattern-dots opacity-[0.35]" />
      <div className="pointer-events-none absolute top-20 right-20 w-72 h-72 rounded-full bg-[var(--accent-subtle)] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-20 w-96 h-96 rounded-full bg-[var(--color-gold-subtle)] opacity-30 blur-3xl" />

      <AuthCard
        title="Selamat Datang"
        subtitle="Sistem PTDARRAHMAN"
        logoUrl={logoUrl || undefined}
        loading={loading}
        success={success}
        error={error}
        successName={successName}
        onSubmit={handleLogin}
        submitText="Masuk"
        forgotText="Lupa username/password?"
        recoveryMode="staff"
        recoveryApiBase={API_BASE}
        badgeText="Akses Terbatas"
        badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-[#D4A853]" />}
      />
    </div>
  );
}
