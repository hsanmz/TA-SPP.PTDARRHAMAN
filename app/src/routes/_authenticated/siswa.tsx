import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Download,
  Edit,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listStudents, saveStudent, archiveStudent, importStudents } from "@/lib/api/students";
import { useAuth } from "@/lib/useAuth";
import { downloadStudentTemplate, exportStudents, parseStudentFile } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
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

export const Route = createFileRoute("/_authenticated/siswa")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Data Siswa — SPP Digital" },
      { name: "description", content: "Kelola data siswa, impor dan ekspor lewat Excel." },
      { property: "og:title", content: "Data Siswa — SPP Digital" },
      { property: "og:description", content: "Kelola data siswa, impor dan ekspor lewat Excel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Siswa,
});

type Student = {
  id: string;
  nis: string;
  full_name: string;
  gender: string | null;
  class_name: string | null;
  grade_level: number | null;
  cohort: string | null;
  status: "active" | "graduated" | "inactive";
  guardian_phone: string | null;
};

const empty = {
  nis: "",
  full_name: "",
  gender: "",
  class_name: "",
  grade_level: "",
  cohort: "",
  status: "active",
  guardian_phone: "",
};

const PAGE_SIZE = 15;

function Siswa() {
  const { role, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ ...empty });

  const { data: students = [], isPending, refetch, isFetching } = useQuery({
    queryKey: ["students"],
    queryFn: () => listStudents(),
  });

  const save = useMutation({
    mutationFn: () =>
      saveStudent({
        data: {
          id: editId ?? undefined,
          nis: form.nis.trim(),
          full_name: form.full_name.trim(),
          gender: form.gender || null,
          class_name: form.class_name || null,
          grade_level: form.grade_level ? Number(form.grade_level) : null,
          cohort: form.cohort || null,
          status: form.status as Student["status"],
          guardian_phone: form.guardian_phone || null,
        },
      }),
    onSuccess: () => {
      toast.success(editId ? "Data siswa diperbarui" : "Siswa ditambahkan");
      setOpen(false);
      setEditId(null);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveStudent({ data: { id } }),
    onSuccess: () => {
      toast.success("Siswa diarsipkan (nonaktif)");
      setArchiveId(null);
      void qc.invalidateQueries({ queryKey: ["students"] });
      void qc.invalidateQueries({ queryKey: ["students-min"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onImport = async (file: File) => {
    try {
      const rows = await parseStudentFile(file);
      if (!rows.length) {
        toast.error("Tidak ada data yang terbaca dari file");
        return;
      }
      await importStudents({ data: rows });
      toast.success(`${rows.length} baris siswa diimpor`);
      void qc.invalidateQueries({ queryKey: ["students"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const filtered = students.filter((s) =>
    [s.nis, s.full_name, s.class_name ?? ""].join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (s: Student) => {
    setEditId(s.id);
    setForm({
      nis: s.nis,
      full_name: s.full_name,
      gender: s.gender ?? "",
      class_name: s.class_name ?? "",
      grade_level: s.grade_level ? String(s.grade_level) : "",
      cohort: s.cohort ?? "",
      status: s.status,
      guardian_phone: s.guardian_phone ?? "",
    });
    setOpen(true);
  };

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Data Siswa" user={user}>
        <EmptyState
          icon={Users}
          title="Halaman ini hanya untuk admin"
          description="Anda masuk sebagai orang tua. Data siswa hanya bisa dikelola oleh admin sekolah."
        />
      </AppShell>
    );
  }

  const activeCount = students.filter((s) => s.status === "active").length;
  const graduatedCount = students.filter((s) => s.status === "graduated").length;

  return (
    <AppShell role={role === "superadmin" ? "superadmin" : "admin"} title="Data Siswa" user={user}>
      <div className="space-y-5 animate-fade-in">
        {/* Header ala project-ppdb */}
        <PageHeaderCard
          title="Data Siswa"
          description={`${students.length} siswa terdaftar. Impor massal lewat Excel atau tambah satu per satu.`}
          loading={isPending}
          action={
            <Button
              onClick={() => {
                setEditId(null);
                setForm({ ...empty });
                setOpen(true);
              }}
              className="gap-1.5 rounded-full shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Siswa
            </Button>
          }
          blocks={[
            {
              icon: Users,
              label: "Total Siswa",
              value: `${students.length} santri`,
              active: true,
            },
            {
              icon: UserCheck,
              label: "Siswa Aktif",
              value: `${activeCount} santri`,
              active: true,
              pulse: true,
            },
            {
              icon: GraduationCap,
              label: "Alumni / Lulus",
              value: `${graduatedCount} santri`,
              active: false,
            },
          ]}
        />

        {/* Toolbar Pencarian & Aksi Impor / Ekspor */}
        <ToolbarCard
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSearchSubmit={(e) => e.preventDefault()}
          searchPlaceholder="Cari NIS, nama siswa, atau kelas..."
          onRefresh={() => void refetch()}
          refreshing={isFetching}
          searchActions={
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-full px-3 text-xs"
                onClick={() => downloadStudentTemplate()}
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                Template
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-full px-3 text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Impor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-full px-3 text-xs"
                onClick={() => void exportStudents(filtered)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Ekspor
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onImport(f);
                  e.target.value = "";
                }}
              />
            </div>
          }
        />

        {/* Tabel Data Siswa */}
        <Card className="overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm">
          {isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title={search ? "Tidak ada siswa yang cocok" : "Belum ada data siswa"}
                description={
                  search
                    ? "Coba kata kunci pencarian lain atau kosongkan kolom pencarian."
                    : "Tambahkan data siswa satu per satu atau unduh template Excel lalu impor secara massal."
                }
                actionLabel={search ? undefined : "Tambah siswa"}
                onAction={
                  search
                    ? undefined
                    : () => {
                        setEditId(null);
                        setForm({ ...empty });
                        setOpen(true);
                      }
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-emerald-primary/5 border-b border-slate-100 [&_tr]:border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[280px]">Siswa</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500">NIS</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kelas & Tingkat</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500">Angkatan</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kontak Wali</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                      <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {shown.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 text-xs">
                              <AvatarFallback className="bg-emerald-primary/10 font-bold text-emerald-primary">
                                {s.full_name?.[0]?.toUpperCase() ?? "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <Link
                                to="/siswa/$studentId"
                                params={{ studentId: s.id }}
                                className="truncate block font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors"
                              >
                                {s.full_name}
                              </Link>
                              <div className="text-[11px] text-slate-400">
                                {s.gender === "L" ? "Laki-laki" : s.gender === "P" ? "Perempuan" : "—"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {s.nis}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="text-xs font-medium text-slate-800">
                            {s.class_name ? `Kelas ${s.class_name}` : "—"}
                            {s.grade_level ? ` (Tk. ${s.grade_level})` : ""}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="text-xs text-slate-600">{s.cohort || "—"}</span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <span className="text-xs text-slate-600">{s.guardian_phone || "—"}</span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {s.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Aktif
                            </span>
                          ) : s.status === "graduated" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                              Alumni
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                              Nonaktif
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 px-2.5 text-xs text-slate-600 hover:text-emerald-primary rounded-lg"
                              onClick={() => openEdit(s)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 border-rose-200 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                              onClick={() => setArchiveId(s.id)}
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Arsip
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-slate-100 md:hidden">
                {shown.map((s) => (
                  <div key={s.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-9 w-9 text-xs">
                          <AvatarFallback className="bg-emerald-primary/10 font-bold text-emerald-primary">
                            {s.full_name?.[0]?.toUpperCase() ?? "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            to="/siswa/$studentId"
                            params={{ studentId: s.id }}
                            className="truncate block font-semibold text-slate-900"
                          >
                            {s.full_name}
                          </Link>
                          <p className="text-xs font-mono text-slate-500">NIS {s.nis}</p>
                        </div>
                      </div>
                      {s.status === "active" ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : s.status === "graduated" ? (
                        <Badge variant="secondary">Lulus</Badge>
                      ) : (
                        <Badge variant="destructive">Nonaktif</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kelas</span>
                        <span className="font-medium text-slate-800">{s.class_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Wali</span>
                        <span className="font-medium text-slate-800">{s.guardian_phone || "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => openEdit(s)}
                      >
                        <Edit className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => setArchiveId(s.id)}
                      >
                        <Archive className="mr-1 h-3.5 w-3.5" />
                        Arsip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {!isPending && filtered.length > PAGE_SIZE && (
            <div className="border-t border-slate-100 p-4">
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </Card>
      </div>

      {/* Modal Tambah / Edit Siswa */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editId ? "Ubah Siswa" : "Tambah Siswa Baru"}
        description="Lengkapi informasi biodata dan kelas siswa sekolah."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={save.isPending}>
              Batal
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["nis", "NIS / Nomor Induk Siswa"],
              ["full_name", "Nama Lengkap"],
              ["gender", "Jenis Kelamin (L/P)"],
              ["class_name", "Kelas (contoh: 7A, 10-IPA)"],
              ["grade_level", "Tingkat (contoh: 7, 8, 9, 10)"],
              ["cohort", "Tahun Angkatan (contoh: 2024)"],
              ["guardian_phone", "Nomor WhatsApp Wali"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-xs">{label}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs">Status Siswa</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="graduated">Lulus</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Dialog Konfirmasi Arsipkan */}
      <ConfirmDialog
        isOpen={archiveId !== null}
        onClose={() => setArchiveId(null)}
        onConfirm={() => archiveId && archive.mutate(archiveId)}
        title="Arsipkan data siswa ini?"
        message="Siswa akan dinonaktifkan dari daftar aktif sekolah. Seluruh riwayat tagihan dan kuitansi tetap tersimpan untuk kebutuhan laporan."
        confirmLabel="Arsipkan Siswa"
        variant="destructive"
        loading={archive.isPending}
      />
    </AppShell>
  );
}
