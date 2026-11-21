import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { updateProfile } from "@/lib/auth-functions";
import { fileToDataUrl } from "@/lib/proof";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { AvatarEditor } from "@/components/ui/avatar-editor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profil")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Profile — Sistem PTDARRAHMAN" },
      { name: "description", content: "Kelola informasi dan keamanan akun Anda." },
      { property: "og:title", content: "Profile — Sistem PTDARRAHMAN" },
      { property: "og:description", content: "Kelola informasi dan keamanan akun Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function FieldLabel({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {children}
    </Label>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, isAdmin } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar_url: "",
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [prevUserId, setPrevUserId] = useState(user?.id);

  // Sinkronkan form saat data user selesai dimuat async (pola render-phase PPDB)
  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id);
    setForm((f) => ({
      ...f,
      username: user?.username || "",
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }));
  }

  const isSuper = role === "superadmin";
  const initials = (user?.full_name || user?.username || "A")[0]?.toUpperCase() ?? "A";
  const roleLabel = isSuper ? "SUPERADMIN" : isAdmin ? "ADMIN" : "ORANG TUA";

  function handleChange(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAvatarUploaded(file: File): Promise<string> {
    const dataUrl = await fileToDataUrl(file, 400, 0.85);
    return dataUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.new_password && form.new_password.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }

    if (form.new_password && form.new_password !== form.confirm_password) {
      toast.error("Konfirmasi password baru tidak cocok.");
      return;
    }

    const payload: {
      full_name?: string;
      email?: string;
      phone?: string;
      old_password?: string;
      new_password?: string;
    } = {};

    if (form.full_name !== user?.full_name) payload.full_name = form.full_name;
    if (isSuper && form.email !== user?.email) payload.email = form.email;
    if (form.phone !== (user?.phone || "")) payload.phone = form.phone;
    if (form.new_password) {
      if (!form.old_password) {
        toast.error("Password lama wajib diisi untuk mengganti password.");
        return;
      }
      payload.old_password = form.old_password;
      payload.new_password = form.new_password;
    }

    if (Object.keys(payload).length === 0) {
      toast.warning("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ data: payload });
      setForm((f) => ({ ...f, old_password: "", new_password: "", confirm_password: "" }));
      toast.success("Profile berhasil diperbarui.");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan profile.");
    } finally {
      setSaving(false);
    }
  }

  const metaRows = [
    { icon: UserRound, label: "Username", value: form.username || "—" },
    { icon: Mail, label: "Email", value: form.email || "—" },
    { icon: Phone, label: "No. WhatsApp", value: form.phone || "—" },
    {
      icon: BadgeCheck,
      label: "Status",
      value: "Active",
      valueClass: "text-emerald-primary",
    },
  ];

  return (
    <AppShell
      role={role === "superadmin" ? "superadmin" : isAdmin ? "admin" : "parent"}
      title="Profile"
      description="Kelola informasi dan keamanan akun Anda"
      user={user}
    >
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        {/* ── Header Bar (PPDB Profile Pattern) ── */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => void navigate({ to: "/beranda" })}
            aria-label="Kembali"
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola informasi dan keamanan akun Anda</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* ── Left Column: Identity Card ── */}
          <aside className="space-y-6">
            <Card className="overflow-hidden shadow-sm">
              <CardContent className="px-5 pt-6 pb-5">
                <div className="flex justify-center">
                  <AvatarEditor
                    value={form.avatar_url}
                    initials={initials}
                    alt={user?.full_name || user?.username}
                    onUpload={handleAvatarUploaded}
                    onUrlApplied={(url) => handleChange("avatar_url", url)}
                  />
                </div>

                <div className="mt-4 text-center">
                  <h2 className="truncate font-heading text-lg font-bold text-foreground">
                    {form.full_name || form.username || "—"}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">@{form.username}</p>
                  <Badge
                    variant={isSuper ? "default" : "gold"}
                    className={cn("mt-2.5", isSuper && "gap-1")}
                  >
                    {isSuper && <ShieldCheck className="h-3 w-3" />}
                    {roleLabel}
                  </Badge>
                </div>

                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  {metaRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label} className="flex items-start gap-2.5 text-sm">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {row.label}
                          </p>
                          <p className={cn("truncate font-medium text-foreground", row.valueClass)}>
                            {row.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* ── Right Column: Form Sections ── */}
          <div className="space-y-6">
            <SectionCard
              title="Informasi Profile"
              description="Data dasar akun Anda yang tampil di sistem."
              icon={UserIcon}
              accent="bg-primary"
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel icon={AtSign}>Username</FieldLabel>
                    <Input
                      value={form.username}
                      disabled
                      className="bg-muted/40 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground">Username akun sistem tidak dapat diubah.</p>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel icon={UserRound}>Full Name</FieldLabel>
                    <Input
                      value={form.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel icon={Mail}>Email</FieldLabel>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="email@example.com"
                      disabled={!isSuper}
                    />
                    {isSuper ? (
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-primary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Email dapat diubah — Anda memiliki akses Superadmin.
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        Email hanya dapat diubah oleh Superadmin. Hubungi admin bila perlu mengubahnya.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FieldLabel icon={Phone}>Nomor WhatsApp</FieldLabel>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="08123456789"
                    />
                    <p className="text-[11px] text-muted-foreground">Nomor aktif untuk notifikasi tagihan dan kuitansi.</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Ganti Password"
              description="Gunakan minimal 6 karakter. Kosongkan jika tidak ingin mengubah password."
              icon={KeyRound}
              accent="bg-gold-accent"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <FieldLabel icon={KeyRound}>Password Lama</FieldLabel>
                  <Input
                    type="password"
                    value={form.old_password}
                    onChange={(e) => handleChange("old_password", e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel icon={KeyRound}>Password Baru</FieldLabel>
                    <Input
                      type="password"
                      value={form.new_password}
                      onChange={(e) => handleChange("new_password", e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel icon={KeyRound}>Konfirmasi Password Baru</FieldLabel>
                    <Input
                      type="password"
                      value={form.confirm_password}
                      onChange={(e) => handleChange("confirm_password", e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate({ to: "/beranda" })}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
