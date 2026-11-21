import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, CalendarClock, Landmark, Plus, ScrollText, Tags, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  listSppSettings,
  createSppSetting,
  toggleSppSetting,
  deleteSppSetting,
} from "@/lib/api/settings";
import { listAuditLogs, listActionLabels } from "@/lib/api/audit";
import {
  listBankAccounts,
  saveBankAccount,
  deleteBankAccount,
  listAcademicYears,
  saveAcademicYear,
  deleteAcademicYear,
  listBillCategories,
  saveBillCategory,
  deleteBillCategory,
} from "@/lib/api/entities";
import { getSchoolProfile } from "@/lib/api/payments";
import { updateSchoolProfile } from "@/lib/api/reports";
import { useAuth } from "@/lib/useAuth";
import { rupiah, tanggalJam } from "@/lib/format";
import { academicYearLabel, currentSemester } from "@/lib/semester";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { TabsTrigger } from "@/components/ui/tabs";
import TabsBarCard from "@/components/shared/TabsBarCard";
import PageHeaderCard from "@/components/shared/PageHeaderCard";
import PaginationControls from "@/components/shared/PaginationControls";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pengaturan SPP — SPP Digital" },
      {
        name: "description",
        content: "Atur nominal SPP per kelas atau tingkat; periode semester dibaca otomatis.",
      },
      { property: "og:title", content: "Pengaturan SPP — SPP Digital" },
      { property: "og:description", content: "Atur nominal SPP per kelas atau tingkat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pengaturan,
});

const card = "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm";
const rowAction =
  "rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-emerald-light/40 hover:text-emerald-primary";
const deleteBtn =
  "grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-rose-danger transition-colors hover:bg-rose-danger/10";

const empty = {
  amount: "",
  scope: "all" as "all" | "class" | "grade",
  class_name: "",
  grade_level: "",
};

function Pengaturan() {
  const { role, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const semester = currentSemester();

  const { data: settings = [] } = useQuery({
    queryKey: ["spp-settings"],
    queryFn: () => listSppSettings(),
  });

  const create = useMutation({
    mutationFn: () =>
      createSppSetting({
        data: {
          amount: Number(form.amount || 0),
          scope: form.scope,
          class_name: form.scope === "class" ? form.class_name.trim() || null : null,
          grade_level: form.scope === "grade" ? Number(form.grade_level) || null : null,
        },
      }),
    onSuccess: () => {
      toast.success("Nominal SPP disimpan");
      setOpen(false);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["spp-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = async (id: string, active: boolean) => {
    try {
      await toggleSppSetting({ data: { id, active } });
      void qc.invalidateQueries({ queryKey: ["spp-settings"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = useMutation({
    mutationFn: (id: string) => deleteSppSetting({ data: { id } }),
    onSuccess: () => {
      toast.success("Nominal SPP dihapus");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["spp-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profil");

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Pengaturan" user={user}>
        <EmptyState
          icon={Building2}
          title="Halaman ini hanya untuk admin"
          description="Anda masuk sebagai orang tua. Pengaturan SPP hanya bisa diakses oleh admin sekolah."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      role={role === "superadmin" ? "superadmin" : "admin"}
      title="Pengaturan SPP"
      user={user}
    >
      <div className="space-y-5">
        <PageHeaderCard
          title="Pengaturan SPP"
          description={`Tahun ajaran ${academicYearLabel()} · semester ${semester.label}`}
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.6} />
              Nominal baru
            </Button>
          }
        />

        <TabsBarCard
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsTrigger value="profil" className="rounded-full px-4 text-xs font-semibold sm:text-sm">
            Profil Sekolah
          </TabsTrigger>
          <TabsTrigger value="spp" className="rounded-full px-4 text-xs font-semibold sm:text-sm">
            Tarif SPP
          </TabsTrigger>
          <TabsTrigger value="bank" className="rounded-full px-4 text-xs font-semibold sm:text-sm">
            Rekening Bank
          </TabsTrigger>
          <TabsTrigger value="tahun-ajaran" className="rounded-full px-4 text-xs font-semibold sm:text-sm">
            Tahun Ajaran
          </TabsTrigger>
          <TabsTrigger value="kategori" className="rounded-full px-4 text-xs font-semibold sm:text-sm">
            Kategori Tagihan
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-full px-4 text-xs font-semibold sm:text-sm">
            Log Aktivitas
          </TabsTrigger>
        </TabsBarCard>

        {activeTab === "profil" && <SchoolProfilePanel />}

        {activeTab === "spp" && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="font-heading text-sm font-bold">Periode otomatis</h2>
              <p className="mt-2 text-sm text-slate-500">
                Tidak ada jatuh tempo maupun denda. Semester dibaca sendiri oleh sistem: Ganjil
                Juli–Desember, Genap Januari–Juni. Sekarang berjalan{" "}
                <span className="text-slate-900">{semester.label}</span>.
              </p>
            </div>

            <div>
              <h2 className="mb-3 font-heading text-sm font-bold">Nominal SPP</h2>
              {settings.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="Belum ada nominal SPP"
                  description="Tambahkan nominal dulu supaya tagihan bulanan bisa dibuat otomatis untuk siswa."
                  actionLabel="Nominal baru"
                  onAction={() => setOpen(true)}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {settings.map((s) => (
                    <div key={s.id} className={card}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold tabular-nums text-slate-900">
                            {rupiah(s.amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {s.class_name
                              ? `Kelas ${s.class_name}`
                              : s.grade_level
                                ? `Tingkat ${s.grade_level}`
                                : "Semua siswa"}{" "}
                            · {s.academic_year} · {s.active ? "aktif" : "nonaktif"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            className={rowAction}
                            onClick={() => void toggle(s.id, !s.active)}
                          >
                            {s.active ? "Matikan" : "Aktifkan"}
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus nominal ${rupiah(s.amount)}`}
                            className={deleteBtn}
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "bank" && <BankAccountsPanel />}
        {activeTab === "tahun-ajaran" && <AcademicYearsPanel />}
        {activeTab === "kategori" && <BillCategoriesPanel />}
        {activeTab === "audit" && <AuditLogPanel />}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Nominal SPP"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={create.isPending}>
              Batal
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Nominal per bulan (Rp)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scope">Berlaku untuk</Label>
            <Select
              value={form.scope}
              onValueChange={(v) => setForm({ ...form, scope: v as typeof form.scope })}
            >
              <SelectTrigger id="scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua siswa</SelectItem>
                <SelectItem value="class">Kelas tertentu</SelectItem>
                <SelectItem value="grade">Tingkat tertentu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.scope === "class" && (
            <div className="space-y-1.5">
              <Label htmlFor="class_name">Nama kelas</Label>
              <Input
                id="class_name"
                value={form.class_name}
                onChange={(e) => setForm({ ...form, class_name: e.target.value })}
              />
            </div>
          )}
          {form.scope === "grade" && (
            <div className="space-y-1.5">
              <Label htmlFor="grade_level">Tingkat</Label>
              <Input
                id="grade_level"
                inputMode="numeric"
                value={form.grade_level}
                onChange={(e) =>
                  setForm({ ...form, grade_level: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus nominal SPP?"
        message="Nominal yang sudah dipakai tagihan bulanan tidak akan terpengaruh."
        confirmLabel="Hapus"
        variant="destructive"
        loading={remove.isPending}
      />
    </AppShell>
  );
}

type SchoolProfile = {
  name: string;
  short_name: string;
  address: string;
  phone: string;
  email: string;
  tagline: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  qris_content: string;
};

const emptyProfile: SchoolProfile = {
  name: "SPP Digital",
  short_name: "SPP Digital",
  address: "",
  phone: "",
  email: "",
  tagline: "",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  qris_content: "",
};

function PanelHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Building2;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-light text-emerald-primary ring-1 ring-emerald-primary/10">
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </div>
        <div>
          <h2 className="font-heading text-sm font-bold">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function SchoolProfilePanel() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["school-profile"],
    queryFn: () => getSchoolProfile(),
  });
  const [form, setForm] = useState<SchoolProfile>(emptyProfile);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? emptyProfile.name,
      short_name: profile.short_name ?? emptyProfile.short_name,
      address: profile.address ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      tagline: profile.tagline ?? "",
      bank_name: profile.bank_name ?? "",
      bank_account_name: profile.bank_account_name ?? "",
      bank_account_number: profile.bank_account_number ?? "",
      qris_content: profile.qris_content ?? "",
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      updateSchoolProfile({
        data: {
          name: form.name.trim() || "SPP Digital",
          short_name: form.short_name.trim() || "SPP Digital",
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          tagline: form.tagline.trim() || null,
          bank_name: form.bank_name.trim() || null,
          bank_account_name: form.bank_account_name.trim() || null,
          bank_account_number: form.bank_account_number.trim() || null,
          qris_content: form.qris_content.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Profil sekolah disimpan");
      void qc.invalidateQueries({ queryKey: ["school-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={card}>
      <PanelHeader
        icon={Building2}
        title="Profil sekolah & identitas pembayaran"
        description="Nama ini tampil di halaman kuitansi. Info bank/QRIS tampil di dialog pembayaran orang tua."
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Nama resmi</Label>
          <Input
            id="profile-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-short">Nama singkat (judul kuitansi)</Label>
          <Input
            id="profile-short"
            value={form.short_name}
            onChange={(e) => setForm({ ...form, short_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-tagline">Tagline</Label>
          <Input
            id="profile-tagline"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profile-address">Alamat</Label>
          <Input
            id="profile-address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">Telepon</Label>
          <Input
            id="profile-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-bank">Nama bank (opsional)</Label>
          <Input
            id="profile-bank"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-bank-name">Atas nama rekening</Label>
          <Input
            id="profile-bank-name"
            value={form.bank_account_name}
            onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-bank-number">No. rekening</Label>
          <Input
            id="profile-bank-number"
            inputMode="numeric"
            value={form.bank_account_number}
            onChange={(e) =>
              setForm({ ...form, bank_account_number: e.target.value.replace(/\D/g, "") })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-qris">Kode QRIS (string, opsional)</Label>
          <Input
            id="profile-qris"
            value={form.qris_content}
            onChange={(e) => setForm({ ...form, qris_content: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending || !profile}>
          {save.isPending ? "Menyimpan..." : "Simpan profil"}
        </Button>
      </div>
    </div>
  );
}

const emptyBank = {
  id: "",
  bank_name: "",
  account_number: "",
  account_holder: "",
  is_active: true,
};

function BankAccountsPanel() {
  const qc = useQueryClient();
  const { data: banks = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => listBankAccounts(),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyBank });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      saveBankAccount({
        data: {
          id: form.id || undefined,
          bank_name: form.bank_name.trim(),
          account_number: form.account_number.trim(),
          account_holder: form.account_holder.trim(),
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Rekening diperbarui" : "Rekening ditambahkan");
      setOpen(false);
      setForm({ ...emptyBank });
      void qc.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBankAccount({ data: { id } }),
    onSuccess: () => {
      toast.success("Rekening dihapus");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={card}>
      <PanelHeader
        icon={Landmark}
        title="Rekening bank"
        description="Daftar rekening yang bisa ditampilkan pada metode pembayaran."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForm({ ...emptyBank });
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.6} />
            Tambah
          </Button>
        }
      />

      <div className="mt-4 divide-y divide-slate-100">
        {banks.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{b.bank_name}</p>
              <p className="text-xs text-slate-500">
                {b.account_number} · a.n. {b.account_holder} · {b.is_active ? "aktif" : "nonaktif"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={`Ubah rekening ${b.bank_name}`}
                className={rowAction}
                onClick={() => {
                  setForm({
                    id: b.id,
                    bank_name: b.bank_name,
                    account_number: b.account_number,
                    account_holder: b.account_holder,
                    is_active: b.is_active,
                  });
                  setOpen(true);
                }}
              >
                Ubah
              </button>
              <button
                type="button"
                aria-label={`Hapus rekening ${b.bank_name}`}
                className={deleteBtn}
                onClick={() => setDeleteId(b.id)}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        ))}
        {banks.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Belum ada rekening.</p>
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Ubah rekening" : "Tambah rekening"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={save.isPending}>
              Batal
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bank-name">Nama bank</Label>
            <Input
              id="bank-name"
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-number">No. rekening</Label>
            <Input
              id="bank-number"
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-holder">Atas nama</Label>
            <Input
              id="bank-holder"
              value={form.account_holder}
              onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Rekening aktif
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus rekening?"
        message="Rekening ini akan dihapus permanen."
        confirmLabel="Hapus"
        variant="destructive"
        loading={remove.isPending}
      />
    </div>
  );
}

const emptyYear = {
  id: "",
  name: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

function AcademicYearsPanel() {
  const qc = useQueryClient();
  const { data: years = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => listAcademicYears(),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyYear });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      saveAcademicYear({
        data: {
          id: form.id || undefined,
          name: form.name.trim(),
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Tahun ajaran diperbarui" : "Tahun ajaran ditambahkan");
      setOpen(false);
      setForm({ ...emptyYear });
      void qc.invalidateQueries({ queryKey: ["academic-years"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAcademicYear({ data: { id } }),
    onSuccess: () => {
      toast.success("Tahun ajaran dihapus");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["academic-years"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={card}>
      <PanelHeader
        icon={CalendarClock}
        title="Tahun ajaran"
        description="Referensi tambahan; periode SPP berjalan tetap dihitung otomatis."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForm({ ...emptyYear });
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.6} />
            Tambah
          </Button>
        }
      />

      <div className="mt-4 divide-y divide-slate-100">
        {years.map((y) => (
          <div key={y.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{y.name}</p>
              <p className="text-xs text-slate-500">
                {[y.start_date, y.end_date].filter(Boolean).join(" – ") || "tanpa rentang"} ·{" "}
                {y.is_active ? "aktif" : "nonaktif"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={`Ubah tahun ajaran ${y.name}`}
                className={rowAction}
                onClick={() => {
                  setForm({
                    id: y.id,
                    name: y.name,
                    start_date: y.start_date ?? "",
                    end_date: y.end_date ?? "",
                    is_active: y.is_active,
                  });
                  setOpen(true);
                }}
              >
                Ubah
              </button>
              <button
                type="button"
                aria-label={`Hapus tahun ajaran ${y.name}`}
                className={deleteBtn}
                onClick={() => setDeleteId(y.id)}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        ))}
        {years.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Belum ada tahun ajaran.</p>
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Ubah tahun ajaran" : "Tambah tahun ajaran"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={save.isPending}>
              Batal
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="year-name">Nama (mis. 2026/2027)</Label>
            <Input
              id="year-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year-start">Mulai</Label>
            <Input
              id="year-start"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year-end">Selesai</Label>
            <Input
              id="year-end"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Tahun ajaran aktif
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus tahun ajaran?"
        message="Tahun ajaran ini akan dihapus permanen."
        confirmLabel="Hapus"
        variant="destructive"
        loading={remove.isPending}
      />
    </div>
  );
}

const emptyCategory = {
  id: "",
  code: "",
  name: "",
  default_amount: "",
  is_active: true,
};

function BillCategoriesPanel() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["bill-categories"],
    queryFn: () => listBillCategories(),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyCategory });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      saveBillCategory({
        data: {
          id: form.id || undefined,
          code: form.code.trim(),
          name: form.name.trim(),
          default_amount: form.default_amount ? Number(form.default_amount) : null,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Kategori diperbarui" : "Kategori ditambahkan");
      setOpen(false);
      setForm({ ...emptyCategory });
      void qc.invalidateQueries({ queryKey: ["bill-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBillCategory({ data: { id } }),
    onSuccess: () => {
      toast.success("Kategori dihapus");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["bill-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className={card}>
      <PanelHeader
        icon={Tags}
        title="Kategori tagihan"
        description="Referensi kategori untuk tagihan non-SPP."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForm({ ...emptyCategory });
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.6} />
            Tambah
          </Button>
        }
      />

      <div className="mt-4 divide-y divide-slate-100">
        {categories.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {c.name} <span className="text-xs font-normal text-slate-500">({c.code})</span>
              </p>
              <p className="text-xs text-slate-500">
                {c.default_amount ? `${rupiah(c.default_amount)} default · ` : ""}
                {c.is_active ? "aktif" : "nonaktif"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={`Ubah kategori ${c.name}`}
                className={rowAction}
                onClick={() => {
                  setForm({
                    id: c.id,
                    code: c.code,
                    name: c.name,
                    default_amount: c.default_amount ? String(c.default_amount) : "",
                    is_active: c.is_active,
                  });
                  setOpen(true);
                }}
              >
                Ubah
              </button>
              <button
                type="button"
                aria-label={`Hapus kategori ${c.name}`}
                className={deleteBtn}
                onClick={() => setDeleteId(c.id)}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Belum ada kategori.</p>
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Ubah kategori" : "Tambah kategori"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={save.isPending}>
              Batal
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-code">Kode</Label>
            <Input
              id="cat-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="OLAHRAGA"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-amount">Nominal default (Rp, opsional)</Label>
            <Input
              id="cat-amount"
              inputMode="numeric"
              value={form.default_amount}
              onChange={(e) =>
                setForm({ ...form, default_amount: e.target.value.replace(/\D/g, "") })
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cat-name">Nama kategori</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Kategori aktif
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus kategori?"
        message="Kategori ini akan dihapus permanen."
        confirmLabel="Hapus"
        variant="destructive"
        loading={remove.isPending}
      />
    </div>
  );
}

function AuditLogPanel() {
  const [page, setPage] = useState(1);
  const { data, isPending } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => listAuditLogs({ data: { page, pageSize: 20 } }),
  });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <div className={card}>
      <PanelHeader
        icon={ScrollText}
        title="Aktivitas sistem"
        description={`Catatan audit dari seluruh pengguna (${total} aktivitas).`}
      />

      <div className="mt-4 divide-y divide-slate-100">
        {isPending &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3">
              <div className="h-3.5 w-48 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        {!isPending &&
          rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {listActionLabels[r.action] ?? r.action}
                </p>
                <p className="text-xs text-slate-500">
                  {tanggalJam(r.created_at)} · {r.full_name || r.username || "Sistem"}
                  {r.entity_type ? ` · ${r.entity_type}` : ""}
                </p>
              </div>
              {r.details && (
                <p className="max-w-48 truncate text-right text-xs text-slate-500">{r.details}</p>
              )}
            </div>
          ))}
        {!isPending && rows.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Belum ada aktivitas.</p>
        )}
      </div>

      {!isPending && total > 0 && (
        <PaginationControls page={page} totalPages={pageCount} onPageChange={setPage} />
      )}
    </div>
  );
}
