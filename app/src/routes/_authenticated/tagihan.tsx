import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Banknote,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Plus,
  Receipt,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  listInvoices,
  listInvoicePayments,
  createNonSppInvoice,
  archiveInvoice,
} from "@/lib/api/invoices";
import { listStudentsMin } from "@/lib/api/students";
import { useAuth } from "@/lib/useAuth";
import { rupiah, tanggal, tanggalJam } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import PaymentStatusBadge from "@/components/shared/PaymentStatusBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tagihan")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tagihan — SPP Digital" },
      {
        name: "description",
        content: "Tagihan SPP otomatis dan tagihan non-SPP yang dibuat manual.",
      },
      { property: "og:title", content: "Tagihan — SPP Digital" },
      { property: "og:description", content: "Tagihan SPP otomatis dan tagihan non-SPP manual." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tagihan,
});

const PAGE_SIZE = 15;

const statusLabel: Record<string, string> = {
  unpaid: "Belum Bayar",
  partial: "Sebagian (Cicilan)",
  paid: "Lunas",
  cancelled: "Dibatalkan",
  archived: "Diarsipkan",
};

type TypeFilter = "all" | "spp" | "non_spp" | "event";
type StatusFilter = "all" | "unpaid" | "partial" | "paid" | "cancelled";

const typeFilters: [TypeFilter, string][] = [
  ["all", "Semua Jenis"],
  ["spp", "SPP Bulanan"],
  ["non_spp", "Non-SPP"],
  ["event", "Kegiatan / Event"],
];

const statusFilters: [StatusFilter, string][] = [
  ["all", "Semua Status"],
  ["unpaid", "Belum Bayar"],
  ["partial", "Cicilan"],
  ["paid", "Lunas"],
  ["cancelled", "Dibatalkan"],
];

function Tagihan() {
  const { role, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const [form, setForm] = useState({
    student_id: "",
    title: "",
    amount: "",
    description: "",
    allow_installment: false,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-min"],
    queryFn: () => listStudentsMin(),
  });

  const { data, isPending, refetch, isFetching } = useQuery({
    queryKey: ["invoices", page, typeFilter, statusFilter, search],
    queryFn: () =>
      listInvoices({
        data: {
          page,
          pageSize: PAGE_SIZE,
          type: typeFilter,
          status: statusFilter,
          search: search || undefined,
        },
      }),
  });

  const { data: detailPayments = [] } = useQuery({
    queryKey: ["invoice-payments", detailId],
    queryFn: () => (detailId ? listInvoicePayments({ data: { invoiceId: detailId } }) : []),
    enabled: detailId !== null,
  });

  const create = useMutation({
    mutationFn: () =>
      createNonSppInvoice({
        data: {
          student_id: form.student_id,
          title: form.title.trim(),
          amount: Number(form.amount) || 0,
          description: form.description.trim() || undefined,
          allow_installment: form.allow_installment,
        },
      }),
    onSuccess: () => {
      toast.success("Tagihan non-SPP berhasil dibuat");
      setOpen(false);
      setForm({
        student_id: "",
        title: "",
        amount: "",
        description: "",
        allow_installment: false,
      });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveInvoice({ data: { id } }),
    onSuccess: () => {
      toast.success("Tagihan berhasil diarsipkan");
      setArchiveId(null);
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nama = (id: string) => {
    const s = students.find((st) => st.id === id);
    return s ? `${s.full_name} (${s.nis})` : id.slice(0, 8);
  };

  const getStudent = (id: string) => students.find((st) => st.id === id);

  const rows = data?.rows ?? [];
  const totalInvoices = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalInvoices / PAGE_SIZE));

  const unpaidCount = rows.filter((r) => r.status === "unpaid").length;
  const partialCount = rows.filter((r) => r.status === "partial").length;
  const paidCount = rows.filter((r) => r.status === "paid").length;
  const totalNominal = rows.reduce((acc, r) => acc + (r.amount || 0), 0);

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Tagihan" user={user}>
        <EmptyState
          icon={FileText}
          title="Halaman ini hanya untuk admin"
          description="Anda masuk sebagai orang tua. Tagihan anak Anda dapat dilihat langsung di halaman Beranda."
        />
      </AppShell>
    );
  }

  return (
    <AppShell role={role === "superadmin" ? "superadmin" : "admin"} title="Tagihan" user={user}>
      <div className="space-y-6 animate-fade-in">
        {/* PageHeaderCard ala project-ppdb */}
        <PageHeaderCard
          title="Manajemen Tagihan"
          description="Monitoring tagihan SPP bulanan otomatis, tagihan non-SPP, dan kegiatan santri."
          loading={isPending}
          docKey="spp-tagihan"
          action={
            <Button
              onClick={() => setOpen(true)}
              className="h-10 rounded-full px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tagihan Non-SPP</span>
            </Button>
          }
          blocks={[
            {
              icon: FileText,
              label: "Total Tagihan",
              value: `${totalInvoices} tagihan`,
              active: true,
            },
            {
              icon: Clock,
              label: "Belum Lunas",
              value: `${unpaidCount + partialCount} tagihan`,
              active: unpaidCount + partialCount > 0,
              pulse: unpaidCount + partialCount > 0,
            },
            {
              icon: CheckCircle2,
              label: "Lunas (Halaman Ini)",
              value: `${paidCount} tagihan`,
              active: paidCount > 0,
            },
            {
              icon: Banknote,
              label: "Total Nilai Halaman",
              value: rupiah(totalNominal),
              active: true,
            },
          ]}
        />

        {/* Filter Bar Kategori & Status */}
        <div className="flex flex-col gap-3">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
            {statusFilters.map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={statusFilter === key ? "default" : "outline"}
                className={cn(
                  "h-8 rounded-full text-xs px-3 font-semibold transition-all cursor-pointer",
                  statusFilter === key
                    ? "bg-emerald-primary text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
                onClick={() => {
                  setStatusFilter(key);
                  setPage(1);
                }}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Kategori Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Jenis:</span>
            {typeFilters.map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={typeFilter === key ? "default" : "outline"}
                className={cn(
                  "h-8 rounded-full text-xs px-3 font-semibold transition-all cursor-pointer",
                  typeFilter === key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
                onClick={() => {
                  setTypeFilter(key);
                  setPage(1);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Toolbar Pencarian & Refresh */}
        <ToolbarCard
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSearchSubmit={(e) => e.preventDefault()}
          searchPlaceholder="Cari nama siswa, NIS, atau judul tagihan..."
          onRefresh={() => void refetch()}
          refreshing={isFetching}
        />

        {/* Table Data Tagihan */}
        <Card className="overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[850px]">
                <thead className="bg-emerald-primary/5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Tagihan & Siswa</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Jenis</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Nominal & Progres</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Tanggal Dibuat</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isPending ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td colSpan={6} className="py-4 px-4 h-14 bg-slate-50/50" />
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12">
                        <EmptyState
                          icon={FileText}
                          title={search ? "Tidak ada tagihan yang cocok" : "Belum ada data tagihan"}
                          description={
                            search
                              ? "Coba kata kunci pencarian lain atau sesuaikan filter status dan jenis."
                              : "Tagihan SPP bulanan dibuat otomatis di Beranda atau buat tagihan non-SPP manual."
                          }
                          actionLabel={search ? undefined : "Buat Tagihan Non-SPP"}
                          onAction={search ? undefined : () => setOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    rows.map((i) => {
                      const st = getStudent(i.student_id);
                      const pct = i.amount
                        ? Math.min(100, Math.round((i.paid_amount / i.amount) * 100))
                        : 0;

                      return (
                        <tr
                          key={i.id}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                          onClick={() => setDetailId(i.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {i.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {st?.full_name ?? nama(i.student_id)}
                              {st?.nis && (
                                <span className="font-mono text-slate-500 ml-1">
                                  · NIS {st.nis}
                                </span>
                              )}
                              {st?.class_name && (
                                <span className="text-slate-400 ml-1">· Kelas {st.class_name}</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full",
                                i.type === "spp"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : i.type === "event"
                                    ? "border-purple-200 bg-purple-50 text-purple-800"
                                    : "border-blue-200 bg-blue-50 text-blue-800",
                              )}
                            >
                              {i.type === "spp"
                                ? "SPP Bulanan"
                                : i.type === "event"
                                  ? "Kegiatan"
                                  : "Non-SPP"}
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold font-mono text-slate-900">
                              {rupiah(i.amount)}
                            </div>
                            <div className="w-36 mt-1.5 space-y-1">
                              <Progress value={pct} className="h-1.5" />
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>{rupiah(i.paid_amount)}</span>
                                <span className="font-semibold">{pct}%</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <PaymentStatusBadge status={i.status} label={statusLabel[i.status]} />
                          </td>

                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            <div>{tanggal(i.created_at)}</div>
                            {i.allow_installment && (
                              <span className="inline-block mt-0.5 text-[10px] text-amber-700 font-medium">
                                Bisa dicicil
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs rounded-lg gap-1 text-slate-700 hover:text-emerald-700 hover:bg-slate-50"
                                onClick={() => setDetailId(i.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Detail</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs rounded-lg text-rose-danger hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => setArchiveId(i.id)}
                                title="Arsipkan tagihan"
                              >
                                <Archive className="h-3.5 w-3.5" />
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

            {!isPending && rows.length > 0 && (
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Buat Tagihan Non-SPP */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Buat Tagihan Non-SPP"
        footer={
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={create.isPending}
            >
              Batal
            </Button>
            <Button
              className="rounded-full px-5"
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.student_id || !form.title || !form.amount}
            >
              {create.isPending ? "Menyimpan..." : "Simpan Tagihan"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="student" className="text-xs font-semibold text-slate-700">
              Pilih Siswa / Santri
            </Label>
            <Select
              value={form.student_id}
              onValueChange={(v) => setForm({ ...form, student_id: v })}
            >
              <SelectTrigger id="student" className="rounded-xl">
                <SelectValue placeholder="Pilih siswa..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name} — NIS {s.nis} {s.class_name ? `(${s.class_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Nama Tagihan
            </Label>
            <Input
              id="title"
              placeholder="Contoh: Seragam Santri Baru, Kitab Kuning, dll."
              className="rounded-xl"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
              Nominal Tagihan (Rp)
            </Label>
            <Input
              id="amount"
              inputMode="numeric"
              placeholder="0"
              className="rounded-xl font-mono"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, "") })}
            />
            {form.amount && (
              <p className="text-[11px] text-emerald-700 font-semibold">
                {rupiah(Number(form.amount))}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Keterangan / Catatan (Opsional)
            </Label>
            <Input
              id="description"
              placeholder="Catatan tambahan untuk wali murid..."
              className="rounded-xl"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer pt-1">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-emerald-primary focus:ring-emerald-primary h-4 w-4"
              checked={form.allow_installment}
              onChange={(e) => setForm({ ...form, allow_installment: e.target.checked })}
            />
            Boleh dibayar secara cicilan / bertahap
          </label>
        </div>
      </Modal>

      {/* Modal Detail Tagihan & Riwayat Pembayaran */}
      {detailId && (
        <DetailDialog
          invoice={rows.find((i) => i.id === detailId) ?? null}
          payments={detailPayments}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}

      {/* Dialog Konfirmasi Arsipkan */}
      <ConfirmDialog
        isOpen={archiveId !== null}
        onClose={() => setArchiveId(null)}
        onConfirm={() => archiveId && archive.mutate(archiveId)}
        title="Arsipkan Tagihan?"
        message="Tagihan yang diarsipkan tidak akan muncul lagi di daftar aktif santri. Tagihan yang sudah memiliki transaksi pembayaran sah tidak dapat diarsipkan."
        confirmLabel="Arsipkan"
        variant="destructive"
        loading={archive.isPending}
      />
    </AppShell>
  );
}

function DetailDialog({
  invoice,
  payments,
  onOpenChange,
}: {
  invoice: {
    id: string;
    title: string;
    amount: number;
    paid_amount: number;
    status: string;
    description: string | null;
    created_at: Date;
    student_id: string;
    period_month: number | null;
  } | null;
  payments: {
    id: string;
    amount: number;
    infaq_amount: number;
    status: string;
    method: string;
    created_at: Date;
    receipt_number: string | null;
    reject_reason: string | null;
    void_reason: string | null;
  }[];
  onOpenChange: (open: boolean) => void;
}) {
  const pct = invoice?.amount
    ? Math.min(100, Math.round((invoice.paid_amount / invoice.amount) * 100))
    : 0;

  return (
    <Modal
      isOpen
      onClose={() => onOpenChange(false)}
      title={invoice?.title ?? "Detail Tagihan"}
      size="lg"
      footer={
        <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
      }
    >
      {!invoice ? (
        <p className="text-sm text-muted-foreground">Tagihan tidak ditemukan pada halaman ini.</p>
      ) : (
        <div className="space-y-5">
          {/* Status & Ringkasan Nominal */}
          <div className="rounded-2xl border border-slate-150 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <PaymentStatusBadge status={invoice.status} label={statusLabel[invoice.status]} />
              <span className="text-xs text-muted-foreground">
                Dibuat: {tanggal(invoice.created_at)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Tagihan</p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {rupiah(invoice.amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Sudah Dibayar</p>
                <p className="text-xl font-bold font-mono text-emerald-primary mt-0.5">
                  {rupiah(invoice.paid_amount)}
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Progress value={pct} className="h-2" />
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Progres Pelunasan</span>
                <span>{pct}%</span>
              </div>
            </div>

            {invoice.description && (
              <p className="text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
                <span className="font-semibold text-slate-700">Keterangan:</span>{" "}
                {invoice.description}
              </p>
            )}
          </div>

          {/* Riwayat Pembayaran */}
          <div className="space-y-2.5">
            <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-emerald-primary" />
              <span>Riwayat Transaksi Masuk</span>
            </h4>

            {payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Belum ada transaksi pembayaran untuk tagihan ini.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-150 bg-white p-3 shadow-xs hover:border-emerald-200 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {rupiah(p.amount)}
                        </span>
                        {p.infaq_amount > 0 && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            + Infaq {rupiah(p.infaq_amount)}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono px-1.5 py-0"
                        >
                          {p.method === "qris" ? "QRIS" : "Offline"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {tanggalJam(p.created_at)} · Status:{" "}
                        <span className="font-semibold">{statusLabel[p.status] ?? p.status}</span>
                      </p>
                      {(p.reject_reason || p.void_reason) && (
                        <p className="text-[11px] text-rose-danger mt-0.5">
                          Alasan: {p.reject_reason || p.void_reason}
                        </p>
                      )}
                    </div>

                    {p.receipt_number && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-full gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 shrink-0"
                      >
                        <Link to="/kuitansi/$nomor" params={{ nomor: p.receipt_number }}>
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Kuitansi {p.receipt_number}</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
