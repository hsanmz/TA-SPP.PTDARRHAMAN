import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Link2,
  Mail,
  Phone,
  Plus,
  Trash2,
  UserCheck,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  listParents,
  listParentStudents,
  createParent,
  addParentStudentLink,
  removeParentStudentLink,
  deleteParent,
  linkParentAccount,
} from "@/lib/api/parents";
import { listStudentsMin } from "@/lib/api/students";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import PageHeaderCard from "@/components/shared/PageHeaderCard";
import ToolbarCard from "@/components/shared/ToolbarCard";
import PaginationControls from "@/components/shared/PaginationControls";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orang-tua")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Orang Tua — SPP Digital" },
      {
        name: "description",
        content: "Daftar orang tua dan hubungkan satu akun ke beberapa siswa.",
      },
      { property: "og:title", content: "Orang Tua — SPP Digital" },
      { property: "og:description", content: "Daftar orang tua dan hubungkan ke beberapa siswa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrangTua,
});

const empty = { full_name: "", phone: "", email: "", address: "", username: "" };
const PAGE_SIZE = 15;

function OrangTua() {
  const { role, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [linkFor, setLinkFor] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [linkUserFor, setLinkUserFor] = useState<string | null>(null);
  const [linkUsername, setLinkUsername] = useState("");
  const [deleteParentId, setDeleteParentId] = useState<string | null>(null);

  const {
    data: parents = [],
    isPending,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["parents"],
    queryFn: () => listParents(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-min"],
    queryFn: () => listStudentsMin(),
  });

  const { data: links = [] } = useQuery({
    queryKey: ["parent-students"],
    queryFn: () => listParentStudents(),
  });

  const save = useMutation({
    mutationFn: () =>
      createParent({
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          username: form.username.trim().toLowerCase() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Data orang tua berhasil ditambahkan");
      setOpen(false);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["parents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addLink = useMutation({
    mutationFn: async () => {
      if (!linkFor || !studentId) throw new Error("Pilih siswa terlebih dahulu");
      await addParentStudentLink({ data: { parentId: linkFor, studentId } });
    },
    onSuccess: () => {
      toast.success("Siswa berhasil dihubungkan ke wali");
      setLinkFor(null);
      setStudentId("");
      void qc.invalidateQueries({ queryKey: ["parent-students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeLink = async (linkId: string) => {
    try {
      await removeParentStudentLink({ data: { id: linkId } });
      toast.success("Hubungan siswa dilepas");
      void qc.invalidateQueries({ queryKey: ["parent-students"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal melepas");
    }
  };

  const removeParent = async (id: string) => {
    try {
      await deleteParent({ data: { id } });
      toast.success("Data orang tua berhasil dihapus");
      setDeleteParentId(null);
      void qc.invalidateQueries({ queryKey: ["parents"] });
      void qc.invalidateQueries({ queryKey: ["parent-students"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    }
  };

  const linkAccount = useMutation({
    mutationFn: async () => {
      if (!linkUserFor || !linkUsername.trim()) throw new Error("Username harus diisi");
      await linkParentAccount({
        data: { parentId: linkUserFor, username: linkUsername.trim().toLowerCase() },
      });
    },
    onSuccess: () => {
      toast.success("Akun login berhasil ditautkan");
      setLinkUserFor(null);
      setLinkUsername("");
      void qc.invalidateQueries({ queryKey: ["parents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Orang Tua" user={user}>
        <EmptyState
          icon={UserSquare2}
          title="Halaman ini hanya untuk admin"
          description="Anda masuk sebagai orang tua. Data orang tua hanya bisa dikelola oleh admin sekolah."
        />
      </AppShell>
    );
  }

  const filteredParents = parents.filter((p) => {
    const q = search.toLowerCase();
    const ownLinks = links.filter((l) => l.parent_id === p.id);
    const studentMatch = ownLinks.some((l) => {
      const s = students.find((st) => st.id === l.student_id);
      return s?.full_name?.toLowerCase().includes(q) || s?.nis?.toLowerCase().includes(q);
    });
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      p.phone.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      studentMatch
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredParents.length / PAGE_SIZE));
  const shownParents = filteredParents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const linkedUsersCount = parents.filter((p) => !!p.user_id).length;
  const totalStudentLinks = links.length;

  return (
    <AppShell role={role === "superadmin" ? "superadmin" : "admin"} title="Orang Tua" user={user}>
      <div className="space-y-6 animate-fade-in">
        {/* PageHeaderCard ala project-ppdb */}
        <PageHeaderCard
          title="Data Wali Murid & Orang Tua"
          description="Kelola akun wali santri, pantau keterhubungan login, dan kaitkan santri ke akun keluarga masing-masing."
          loading={isPending}
          docKey="spp-orang-tua"
          action={
            <Button
              onClick={() => {
                setForm({ ...empty });
                setOpen(true);
              }}
              className="h-10 rounded-full px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Orang Tua</span>
            </Button>
          }
          blocks={[
            {
              icon: UserSquare2,
              label: "Total Wali Terdaftar",
              value: `${parents.length} wali murid`,
              active: true,
            },
            {
              icon: UserCheck,
              label: "Akun Login Aktif",
              value: `${linkedUsersCount} akun tersambung`,
              active: true,
            },
            {
              icon: Users,
              label: "Santri Terhubung",
              value: `${totalStudentLinks} santri`,
              active: true,
              pulse: true,
            },
          ]}
        />

        {/* Toolbar Pencarian & Refresh */}
        <ToolbarCard
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSearchSubmit={(e) => e.preventDefault()}
          searchPlaceholder="Cari nama orang tua, username, nomor WhatsApp, atau nama anak..."
          onRefresh={() => void refetch()}
          refreshing={isFetching}
        />

        {/* Tabel Data Orang Tua ala project-ppdb */}
        <Card className="overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[850px]">
                <thead className="bg-emerald-primary/5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Wali Murid / Orang Tua</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Kontak</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Santri Terhubung</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Status Akun</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isPending ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td colSpan={5} className="py-4 px-4 h-14 bg-slate-50/50" />
                      </tr>
                    ))
                  ) : shownParents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12">
                        <EmptyState
                          icon={UserSquare2}
                          title={search ? "Tidak ada orang tua yang cocok" : "Belum ada data orang tua"}
                          description={
                            search
                              ? "Coba kata kunci pencarian lain atau kosongkan kolom pencarian."
                              : "Tambahkan data orang tua santri agar dapat login untuk melihat tagihan dan kuitansi."
                          }
                          actionLabel={search ? undefined : "Tambah Orang Tua"}
                          onAction={search ? undefined : () => setOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    shownParents.map((p) => {
                      const own = links.filter((l) => l.parent_id === p.id);
                      const initials = (p.full_name || "W").slice(0, 2).toUpperCase();

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          {/* Nama & Username */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 text-xs">
                                <AvatarFallback className="bg-emerald-primary/10 font-bold text-emerald-primary">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {p.full_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {p.username ? (
                                    <span className="font-mono text-emerald-700">@{p.username}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Belum ada username</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Kontak */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>{p.phone || "—"}</span>
                            </div>
                            {p.email && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{p.email}</span>
                              </div>
                            )}
                            {p.address && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                                {p.address}
                              </p>
                            )}
                          </td>

                          {/* Santri Terhubung */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                              {own.map((l) => {
                                const s = students.find((st) => st.id === l.student_id);
                                return (
                                  <span
                                    key={l.id}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 font-medium shadow-2xs"
                                  >
                                    <span className="truncate max-w-[120px]">
                                      {s?.full_name ?? "Santri"}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`Lepas ${s?.full_name ?? "siswa"}`}
                                      className="text-slate-400 hover:text-rose-danger transition-colors cursor-pointer"
                                      onClick={() => void removeLink(l.id)}
                                      title="Lepas keterhubungan santri"
                                    >
                                      <X className="h-3 w-3" strokeWidth={2.2} />
                                    </button>
                                  </span>
                                );
                              })}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] rounded-full px-2 gap-1 border-dashed border-slate-300 text-slate-500 hover:border-emerald-primary hover:text-emerald-primary hover:bg-emerald-50/50"
                                onClick={() => setLinkFor(p.id)}
                              >
                                <Plus className="h-3 w-3" />
                                <span>Kaitkan Santri</span>
                              </Button>
                            </div>
                          </td>

                          {/* Status Akun */}
                          <td className="py-3 px-4">
                            {p.user_id ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                Akun Tersambung
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                  Belum Login
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => {
                                    setLinkUserFor(p.id);
                                    setLinkUsername(p.username || "");
                                  }}
                                >
                                  Tautkan
                                </Button>
                              </div>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!p.user_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2.5 text-xs rounded-lg gap-1 text-slate-700 hover:text-emerald-700 hover:bg-slate-50"
                                  onClick={() => {
                                    setLinkUserFor(p.id);
                                    setLinkUsername(p.username || "");
                                  }}
                                  title="Tautkan Akun Login"
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                  <span>Tautkan Akun</span>
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs rounded-lg text-rose-danger hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => setDeleteParentId(p.id)}
                                title="Hapus data orang tua"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!isPending && filteredParents.length > 0 && (
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah Orang Tua */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Tambah Orang Tua Baru"
        footer={
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={save.isPending}
            >
              Batal
            </Button>
            <Button
              className="rounded-full px-5"
              onClick={() => save.mutate()}
              disabled={save.isPending || !form.full_name || !form.phone}
            >
              {save.isPending ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs font-semibold text-slate-700">
              Nama Lengkap Wali
            </Label>
            <Input
              id="full_name"
              placeholder="Contoh: H. Ahmad Subardjo"
              className="rounded-xl"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
              Nomor WhatsApp / HP
            </Label>
            <Input
              id="phone"
              placeholder="08123456789"
              className="rounded-xl font-mono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-semibold text-slate-700">
              Username Akun Login
            </Label>
            <Input
              id="username"
              placeholder="budi_santoso (huruf kecil & angka)"
              className="rounded-xl font-mono"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            />
            <p className="text-[11px] text-muted-foreground">
              Username ini akan otomatis dipakai wali saat login pertama kali ke portal wali santri.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
              Alamat Email (Opsional)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="orangtua@gmail.com"
              className="rounded-xl"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
              Alamat Domisili (Opsional)
            </Label>
            <Input
              id="address"
              placeholder="Jl. Pesantren No. 10, Jakarta"
              className="rounded-xl"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Hubungkan Siswa */}
      <Modal
        isOpen={!!linkFor}
        onClose={() => setLinkFor(null)}
        title="Hubungkan Santri ke Wali"
        footer={
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setLinkFor(null)}
              disabled={addLink.isPending}
            >
              Batal
            </Button>
            <Button
              className="rounded-full px-5"
              onClick={() => addLink.mutate()}
              disabled={addLink.isPending || !studentId}
            >
              {addLink.isPending ? "Menghubungkan..." : "Hubungkan Santri"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-slate-700">Pilih Santri</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Cari dan pilih nama santri..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name} — NIS {s.nis} {s.class_name ? `(${s.class_name})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Wali murid dapat mengakses seluruh tagihan SPP dan riwayat pembayaran santri yang terhubung.
          </p>
        </div>
      </Modal>

      {/* Modal Tautkan Akun Login */}
      <Modal
        isOpen={!!linkUserFor}
        onClose={() => setLinkUserFor(null)}
        title="Tautkan Akun Login Wali"
        footer={
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setLinkUserFor(null)}
              disabled={linkAccount.isPending}
            >
              Batal
            </Button>
            <Button
              className="rounded-full px-5"
              onClick={() => linkAccount.mutate()}
              disabled={linkAccount.isPending || !linkUsername.trim()}
            >
              {linkAccount.isPending ? "Menautkan..." : "Tautkan Akun"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="link-username" className="text-xs font-semibold text-slate-700">
              Username Akun Pengguna
            </Label>
            <Input
              id="link-username"
              className="rounded-xl font-mono"
              value={linkUsername}
              autoCapitalize="none"
              onChange={(e) => setLinkUsername(e.target.value.toLowerCase())}
              placeholder="Contoh: ahmad_subardjo"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Pastikan akun wali sudah terdaftar di sistem. Data profil orang tua akan otomatis tersambung ke user tersebut.
          </p>
        </div>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteParentId !== null}
        onClose={() => setDeleteParentId(null)}
        onConfirm={() => deleteParentId && void removeParent(deleteParentId)}
        title="Hapus Data Orang Tua?"
        message="Data orang tua dan relasi hubungan dengan santri akan dihapus. Tagihan dan kuitansi pembayaran santri tetap aman tersimpan di sistem."
        confirmLabel="Hapus Orang Tua"
        variant="destructive"
      />
    </AppShell>
  );
}
