import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Plus, Shield, ShieldCheck, UserCog, UserMinus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { createAdminUser, removeAdminUser, resetAdminPassword } from "@/lib/auth-functions";
import { listStaff } from "@/lib/api/staff";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import PageHero from "@/components/shared/PageHero";
import ToolbarCard from "@/components/shared/ToolbarCard";

export const Route = createFileRoute("/_authenticated/pengguna")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pengguna — SPP Digital" },
      { name: "description", content: "Kelola user admin oleh superadmin." },
      { property: "og:title", content: "Pengguna — SPP Digital" },
      { property: "og:description", content: "Kelola user admin oleh superadmin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pengguna,
});

type StaffWithProfile = {
  user_id: string;
  role: "superadmin" | "admin";
  username: string | null;
  full_name: string | null;
};

function Pengguna() {
  const { role, user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", password: "" });

  const { data: staff = [], isPending, refetch, isFetching } = useQuery<StaffWithProfile[]>({
    queryKey: ["staff-users"],
    queryFn: () => listStaff(),
  });

  const create = useMutation({
    mutationFn: async () => createAdminUser({ data: form }),
    onSuccess: () => {
      toast.success("User admin berhasil dibuat");
      setOpen(false);
      setForm({ username: "", full_name: "", password: "" });
      void qc.invalidateQueries({ queryKey: ["staff-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [removeTarget, setRemoveTarget] = useState<{ id: string; username: string } | null>(null);

  const remove = useMutation({
    mutationFn: async (userId: string) => removeAdminUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Akses admin dicabut");
      setRemoveTarget(null);
      void qc.invalidateQueries({ queryKey: ["staff-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [resetTarget, setResetTarget] = useState<{
    id: string;
    username: string;
    password: string;
  } | null>(null);

  const resetPw = useMutation({
    mutationFn: async (t: { id: string; password: string }) =>
      resetAdminPassword({ data: { userId: t.id, password: t.password } }),
    onSuccess: () => {
      toast.success("Kata sandi berhasil direset");
      setResetTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (role && role !== "superadmin") {
    return (
      <AppShell role="parent" title="Pengguna" user={user}>
        <EmptyState
          icon={UserCog}
          title="Halaman ini hanya untuk superadmin"
          description="Kelola user admin hanya bisa dilakukan oleh superadmin sekolah."
        />
      </AppShell>
    );
  }

  const filteredStaff = staff.filter((s) =>
    [s.full_name ?? "", s.username ?? ""].join(" ").toLowerCase().includes(search.toLowerCase()),
  );

  const superadminCount = staff.filter((s) => s.role === "superadmin").length;
  const adminCount = staff.filter((s) => s.role === "admin").length;

  return (
    <AppShell role="superadmin" title="Kelola Pengguna" user={user}>
      <div className="space-y-5 animate-fade-in">
        {/* PageHero ala Superadmin */}
        <PageHero
          eyebrow="Akses & Keamanan Sekolah"
          title="Manajemen Pengguna & Staf"
          description="Kelola akun pengguna, hak akses staf tata usaha, dan kredensial administratif sekolah."
          chips={[
            { icon: Users, label: `${staff.length} Pengguna Terdaftar` },
            { icon: ShieldCheck, label: `${superadminCount} Superadmin` },
            { icon: Shield, label: `${adminCount} Admin Aktif` },
          ]}
          actions={
            <Button
              onClick={() => setOpen(true)}
              className="gap-1.5 rounded-full bg-white text-emerald-900 shadow-md hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4" />
              Admin Baru
            </Button>
          }
        />

        {/* Toolbar Pencarian */}
        <ToolbarCard
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={(e) => e.preventDefault()}
          searchPlaceholder="Cari username atau nama staf..."
          onRefresh={() => void refetch()}
          refreshing={isFetching}
        />

        {/* Tabel Data Staf */}
        <Card className="overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm">
          {isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UserCog}
                title={search ? "Tidak ada pengguna yang cocok" : "Belum ada user staf"}
                description="Buat user admin baru untuk membantu mengelola operasional SPP sekolah."
                actionLabel={search ? undefined : "Buat User Admin"}
                onAction={search ? undefined : () => setOpen(true)}
              />
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-emerald-primary/5 border-b border-slate-100 [&_tr]:border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[320px]">Staf / Pengguna</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500">Username</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500">Peran Akses</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {filteredStaff.map((s) => {
                      const initials = (s.full_name ?? s.username ?? "?").slice(0, 2).toUpperCase();
                      const isSuperadmin = s.role === "superadmin";
                      return (
                        <TableRow key={`${s.user_id}-${s.role}`} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 text-xs">
                                <AvatarFallback className="bg-emerald-primary/10 font-bold text-emerald-primary">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{s.full_name || "—"}</p>
                                <p className="text-[11px] text-slate-400">ID: {s.user_id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              @{s.username || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {isSuperadmin ? (
                              <Badge className="gap-1 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50 rounded-full px-2.5 py-0.5">
                                <ShieldCheck className="h-3 w-3" /> Superadmin
                              </Badge>
                            ) : (
                              <Badge variant="success" className="gap-1 rounded-full px-2.5 py-0.5">
                                <Shield className="h-3 w-3" /> Admin
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            {!isSuperadmin ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 px-2.5 text-xs text-slate-600 hover:text-emerald-primary rounded-lg"
                                  onClick={() =>
                                    setResetTarget({
                                      id: s.user_id,
                                      username: s.username ?? "-",
                                      password: "",
                                    })
                                  }
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                  Reset Sandi
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 border-rose-200 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                                  onClick={() =>
                                    setRemoveTarget({ id: s.user_id, username: s.username ?? "-" })
                                  }
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                  Cabut Akses
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic pr-2">Akses Utama</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredStaff.map((s) => {
                  const initials = (s.full_name ?? s.username ?? "?").slice(0, 2).toUpperCase();
                  const isSuperadmin = s.role === "superadmin";
                  return (
                    <div key={`${s.user_id}-${s.role}`} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 text-xs">
                            <AvatarFallback className="bg-emerald-primary/10 font-bold text-emerald-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{s.full_name || "—"}</p>
                            <p className="font-mono text-xs text-slate-500">@{s.username || "—"}</p>
                          </div>
                        </div>
                        {isSuperadmin ? (
                          <Badge className="border-purple-200 bg-purple-50 text-purple-700">SA</Badge>
                        ) : (
                          <Badge variant="success">Admin</Badge>
                        )}
                      </div>
                      {!isSuperadmin && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() =>
                              setResetTarget({
                                id: s.user_id,
                                username: s.username ?? "-",
                                password: "",
                              })
                            }
                          >
                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                            Reset Sandi
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() =>
                              setRemoveTarget({ id: s.user_id, username: s.username ?? "-" })
                            }
                          >
                            <UserMinus className="mr-1 h-3.5 w-3.5" />
                            Cabut Akses
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Modal Admin Baru */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Buat Akun Staf Admin"
        description="Tambahkan pengguna baru dengan hak akses admin tata usaha sekolah."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={create.isPending}>
              Batal
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Membuat..." : "Buat Akun Admin"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sa-name" className="text-xs">Nama Lengkap Staf</Label>
            <Input
              id="sa-name"
              placeholder="Contoh: Ahmad Fauzi, S.Pd"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa-username" className="text-xs">Username (huruf kecil & angka)</Label>
            <Input
              id="sa-username"
              placeholder="contoh: ahmadfauzi"
              value={form.username}
              autoCapitalize="none"
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9._]{3,30}"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sa-password" className="text-xs">Kata Sandi Awal</Label>
            <Input
              id="sa-password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>
        </div>
      </Modal>

      {/* Modal Reset Sandi */}
      <Modal
        isOpen={resetTarget !== null}
        onClose={() => setResetTarget(null)}
        title={`Reset Kata Sandi @${resetTarget?.username ?? ""}`}
        description="Masukkan kata sandi baru untuk user ini."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setResetTarget(null)}
              disabled={resetPw.isPending}
            >
              Batal
            </Button>
            <Button
              disabled={resetPw.isPending || !resetTarget || resetTarget.password.length < 6}
              onClick={() => resetTarget && resetPw.mutate(resetTarget)}
            >
              {resetPw.isPending ? "Menyimpan..." : "Simpan Kata Sandi"}
            </Button>
          </>
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="reset-password" className="text-xs">Kata Sandi Baru</Label>
          <Input
            id="reset-password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={resetTarget?.password ?? ""}
            minLength={6}
            onChange={(e) => setResetTarget((t) => (t ? { ...t, password: e.target.value } : t))}
          />
          <p className="text-xs text-muted-foreground">User akan masuk menggunakan kata sandi baru ini.</p>
        </div>
      </Modal>

      {/* Dialog Konfirmasi Cabut Akses */}
      <ConfirmDialog
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && remove.mutate(removeTarget.id)}
        title={`Cabut akses admin @${removeTarget?.username ?? ""}?`}
        message="User tersebut akan kehilangan hak akses administratif dan hanya berstatus sebagai pengguna reguler."
        confirmLabel="Cabut Akses Admin"
        variant="destructive"
        loading={remove.isPending}
      />
    </AppShell>
  );
}
