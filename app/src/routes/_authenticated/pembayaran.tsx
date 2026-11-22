import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Plus,
  Receipt,
  RotateCcw,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  listPayments,
  recordPayment,
  confirmPayment,
  rejectPayment,
  voidPayment,
} from "@/lib/api/payments";
import { listOpenInvoices } from "@/lib/api/invoices";
import { listStudentsMin } from "@/lib/api/students";
import { fileToDataUrl } from "@/lib/proof";
import { useAuth } from "@/lib/useAuth";
import { rupiah, tanggal, tanggalJam } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import PaymentStatusBadge from "@/components/shared/PaymentStatusBadge";
import PageHeaderCard from "@/components/shared/PageHeaderCard";
import ToolbarCard from "@/components/shared/ToolbarCard";
import PaginationControls from "@/components/shared/PaginationControls";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pembayaran")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pembayaran — SPP Digital" },
      {
        name: "description",
        content:
          "Konfirmasi pembayaran masuk: QRIS atau offline, lengkap dengan infaq dan kuitansi bernomor.",
      },
      { property: "og:title", content: "Pembayaran — SPP Digital" },
      {
        property: "og:description",
        content: "Konfirmasi pembayaran dan terbitkan kuitansi bernomor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pembayaran,
});

const PAGE_SIZE = 15;

type PayStatus = "all" | "pending" | "confirmed" | "rejected" | "voided";

type PaymentRow = {
  id: string;
  student_id: string | null;
  amount: number;
  infaq_amount: number;
  status: "pending" | "confirmed" | "rejected" | "voided";
  method: string;
  created_at: Date;
  note: string | null;
  proof_url: string | null;
  rejected_at: Date | null;
  voided_at: Date | null;
  reject_reason: string | null;
  void_reason: string | null;
  receipt_number: string | null;
};

const emptyForm = {
  invoice_id: "",
  amount: "",
  infaq_amount: "",
  method: "offline" as "offline" | "qris",
  note: "",
};

const statusFilters: [PayStatus, string][] = [
  ["all", "Semua Status"],
  ["pending", "Menunggu Verifikasi"],
  ["confirmed", "Dikonfirmasi (Lunas)"],
  ["rejected", "Ditolak"],
  ["voided", "Dibatalkan"],
];

function Pembayaran() {
  const { role, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<PayStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [proof, setProof] = useState<File | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; reason: string } | null>(null);
  const [voidTarget, setVoidTarget] = useState<{ id: string; reason: string } | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["students-min"],
    queryFn: () => listStudentsMin(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["open-invoices"],
    queryFn: () => listOpenInvoices(),
    enabled: open,
  });

  const { data, isPending, refetch, isFetching } = useQuery({
    queryKey: ["payments", tab, page, search],
    queryFn: () =>
      listPayments({
        data: {
          admin: true,
          status: tab === "all" ? undefined : tab,
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
        },
      }),
  });

  const nama = (id: string | null) => {
    if (!id) return "Umum";
    const s = students.find((st) => st.id === id);
    return s ? `${s.full_name} (${s.nis})` : id.slice(0, 8);
  };

  const getStudent = (id: string | null) => {
    if (!id) return null;
    return students.find((st) => st.id === id);
  };

  const record = useMutation({
    mutationFn: async () => {
      let proofUrl: string | undefined;
      if (proof) {
        proofUrl = await fileToDataUrl(proof);
      }
      return recordPayment({
        data: {
          invoice_id: form.invoice_id,
          amount: Number(form.amount) || 0,
          infaq_amount: Number(form.infaq_amount) || 0,
          method: form.method,
          note: form.note || undefined,
          proof_url: proofUrl,
        },
      });
    },
    onSuccess: () => {
      toast.success("Pembayaran berhasil dicatat");
      setOpen(false);
      setForm({ ...emptyForm });
      setProof(null);
      void qc.invalidateQueries({ queryKey: ["payments"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["beranda-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirm = useMutation({
    mutationFn: (id: string) => confirmPayment({ data: { paymentId: id } }),
    onSuccess: () => {
      toast.success("Pembayaran dikonfirmasi, kuitansi telah terbit");
      void qc.invalidateQueries({ queryKey: ["payments"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["beranda-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectPayment({ data: { paymentId: id, reason: reason || "Bukti pembayaran tidak sesuai" } }),
    onSuccess: () => {
      toast.success("Pembayaran ditolak");
      setRejectTarget(null);
      void qc.invalidateQueries({ queryKey: ["payments"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["beranda-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const voidPay = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      voidPayment({
        data: { paymentId: id, reason: reason || "Pembayaran dibatalkan oleh admin" },
      }),
    onSuccess: () => {
      toast.success("Pembayaran dibatalkan dan saldo tagihan dikembalikan");
      setVoidTarget(null);
      void qc.invalidateQueries({ queryKey: ["payments"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["beranda-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data?.rows ?? []) as PaymentRow[];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const confirmedCount = rows.filter((r) => r.status === "confirmed").length;
  const totalRevenue = rows
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + (r.amount || 0) + (r.infaq_amount || 0), 0);

  return (
    <AppShell
      role={role === "superadmin" ? "superadmin" : isAdmin ? "admin" : "parent"}
      title={isAdmin ? "Pembayaran" : "Riwayat Pembayaran"}
      user={user}
    >
      <div className="space-y-6 animate-fade-in">
        {/* PageHeaderCard ala project-ppdb */}
        <PageHeaderCard
          title={isAdmin ? "Monitoring Pembayaran" : "Riwayat Pembayaran"}
          description={
            isAdmin
              ? "Verifikasi bukti transfer santri, terbitkan kuitansi resmi bertanda tangan digital, dan catat pembayaran offline kasir."
              : "Riwayat seluruh transaksi pembayaran santri beserta kuitansi digital sah."
          }
          loading={isPending}
          docKey="spp-pembayaran"
          action={
            isAdmin ? (
              <Button
                onClick={() => setOpen(true)}
                className="h-10 rounded-full px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Catat Pembayaran</span>
              </Button>
            ) : undefined
          }
          blocks={[
            {
              icon: CreditCard,
              label: "Total Transaksi",
              value: `${totalItems} transaksi`,
              active: true,
            },
            {
              icon: Clock,
              label: "Perlu Verifikasi",
              value: `${pendingCount} transaksi`,
              active: pendingCount > 0,
              pulse: pendingCount > 0,
            },
            {
              icon: CheckCircle2,
              label: "Dikonfirmasi Sah",
              value: `${confirmedCount} transaksi`,
              active: confirmedCount > 0,
            },
            {
              icon: Banknote,
              label: "Penerimaan Terverifikasi",
              value: rupiah(totalRevenue),
              active: true,
            },
          ]}
        />

        {/* Filter Status Bar */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Filter Status:</span>
            {statusFilters.map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={tab === key ? "default" : "outline"}
                className={cn(
                  "h-8 rounded-full text-xs px-3 font-semibold transition-all cursor-pointer",
                  tab === key
                    ? "bg-emerald-primary text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        {/* Toolbar Pencarian & Refresh */}
        <ToolbarCard
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSearchSubmit={(e) => e.preventDefault()}
          searchPlaceholder="Cari no. kuitansi, nama santri, atau keterangan..."
          onRefresh={() => void refetch()}
          refreshing={isFetching}
        />

        {/* Tabel Pembayaran ala project-ppdb PembayaranFormulirPage */}
        <Card className="overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-emerald-primary/5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4 text-left whitespace-nowrap">No. Kuitansi</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Santri / Pembayar</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Nominal & Infaq</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Metode</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Waktu Transaksi</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Bukti Bayar</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isPending ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td colSpan={8} className="py-4 px-4 h-14 bg-slate-50/50" />
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12">
                        <EmptyState
                          icon={Receipt}
                          title={
                            isAdmin
                              ? "Tidak ada transaksi pembayaran pada filter ini"
                              : "Belum ada riwayat pembayaran"
                          }
                          description={
                            isAdmin
                              ? "Coba ubah status filter pencarian atau catat pembayaran baru secara manual."
                              : "Riwayat pembayaran Anda akan otomatis tampil di sini segera setelah dikonfirmasi pihak tata usaha."
                          }
                          actionLabel={isAdmin ? "Catat Pembayaran" : undefined}
                          onAction={isAdmin ? () => setOpen(true) : undefined}
                        />
                      </td>
                    </tr>
                  ) : (
                    rows.map((p) => {
                      const st = getStudent(p.student_id);
                      const isPendingItem = p.status === "pending";
                      const isConfirmed = p.status === "confirmed";

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          {/* No Kuitansi */}
                          <td className="py-3 px-4">
                            {p.receipt_number ? (
                              <Link
                                to="/kuitansi/$nomor"
                                params={{ nomor: p.receipt_number }}
                                className="font-mono text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>{p.receipt_number}</span>
                              </Link>
                            ) : (
                              <span className="font-mono text-xs text-slate-400">
                                #{p.id.slice(0, 8)}
                              </span>
                            )}
                          </td>

                          {/* Santri */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {st?.full_name ?? nama(p.student_id)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {st?.nis && (
                                <span className="font-mono text-slate-500">NIS {st.nis}</span>
                              )}
                              {st?.class_name && (
                                <span className="text-slate-400 ml-1">· Kelas {st.class_name}</span>
                              )}
                              {p.note && <span className="text-slate-500 ml-1">· {p.note}</span>}
                            </div>
                          </td>

                          {/* Nominal */}
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900">
                              {rupiah(p.amount + p.infaq_amount)}
                            </div>
                            {p.infaq_amount > 0 && (
                              <div className="text-[10px] text-emerald-700 font-medium">
                                Pokok {rupiah(p.amount)} + Infaq {rupiah(p.infaq_amount)}
                              </div>
                            )}
                          </td>

                          {/* Metode */}
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-mono px-2 py-0.5 rounded-full",
                                p.method === "qris"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : "border-slate-200 bg-slate-50 text-slate-700",
                              )}
                            >
                              {p.method === "qris" ? "QRIS" : "Offline / Kasir"}
                            </Badge>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <PaymentStatusBadge
                              status={
                                p.status === "confirmed"
                                  ? "paid"
                                  : p.status === "rejected"
                                    ? "failed"
                                    : p.status === "voided"
                                      ? "cancelled"
                                      : "pending"
                              }
                            />
                            {(p.reject_reason || p.void_reason) && (
                              <p
                                className="text-[10px] text-rose-danger mt-1 max-w-[140px] truncate"
                                title={p.reject_reason || p.void_reason || undefined}
                              >
                                {p.reject_reason || p.void_reason}
                              </p>
                            )}
                          </td>

                          {/* Waktu */}
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            <div>{tanggal(p.created_at)}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(p.created_at).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              WIB
                            </div>
                          </td>

                          {/* Bukti Bayar */}
                          <td className="py-3 px-4">
                            {p.proof_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs rounded-lg px-2 gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => setViewProof(p.proof_url)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Lihat</span>
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isAdmin && isPendingItem && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs rounded-lg px-2.5 gap-1 bg-emerald-primary hover:bg-emerald-dark text-white font-semibold"
                                    onClick={() => confirm.mutate(p.id)}
                                    disabled={confirm.isPending}
                                  >
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                    <span>Konfirmasi</span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs rounded-lg px-2 gap-1 text-rose-danger border-rose-200 hover:bg-rose-50"
                                    disabled={reject.isPending}
                                    onClick={() => setRejectTarget({ id: p.id, reason: "" })}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Tolak</span>
                                  </Button>
                                </>
                              )}

                              {isAdmin && isConfirmed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs rounded-lg px-2 gap-1 text-rose-danger border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                                  disabled={voidPay.isPending}
                                  onClick={() => setVoidTarget({ id: p.id, reason: "" })}
                                  title="Batalkan pembayaran"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  <span>Batal</span>
                                </Button>
                              )}

                              {p.receipt_number && (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs rounded-lg px-2.5 gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                >
                                  <Link to="/kuitansi/$nomor" params={{ nomor: p.receipt_number }}>
                                    <Receipt className="h-3.5 w-3.5" />
                                    <span>Kuitansi</span>
                                  </Link>
                                </Button>
                              )}
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

      {/* Modal Catat Pembayaran Baru */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Catat Pembayaran Baru"
        footer={
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={record.isPending}
            >
              Batal
            </Button>
            <Button
              className="rounded-full px-5"
              onClick={() => record.mutate()}
              disabled={record.isPending || !form.invoice_id || !form.amount}
            >
              {record.isPending ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invoice" className="text-xs font-semibold text-slate-700">
              Pilih Tagihan Terbuka
            </Label>
            <Select
              value={form.invoice_id}
              onValueChange={(v) => {
                const inv = invoices.find((i) => i.id === v);
                setForm({
                  ...form,
                  invoice_id: v,
                  amount: inv ? String(inv.amount - inv.paid_amount) : "",
                });
              }}
            >
              <SelectTrigger id="invoice" className="rounded-xl">
                <SelectValue placeholder="Pilih tagihan santri..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {invoices.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {nama(i.student_id)} — {i.title} (Sisa: {rupiah(i.amount - i.paid_amount)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
                Nominal Bayar (Rp)
              </Label>
              <Input
                id="amount"
                inputMode="numeric"
                className="rounded-xl font-mono"
                placeholder="0"
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
              <Label htmlFor="infaq" className="text-xs font-semibold text-slate-700">
                Infaq Sukarela (Opsional)
              </Label>
              <Input
                id="infaq"
                inputMode="numeric"
                className="rounded-xl font-mono"
                placeholder="0"
                value={form.infaq_amount}
                onChange={(e) =>
                  setForm({ ...form, infaq_amount: e.target.value.replace(/\D/g, "") })
                }
              />
              {form.infaq_amount && (
                <p className="text-[11px] text-emerald-700 font-semibold">
                  {rupiah(Number(form.infaq_amount))}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method" className="text-xs font-semibold text-slate-700">
              Metode Pembayaran
            </Label>
            <Select
              value={form.method}
              onValueChange={(v) => setForm({ ...form, method: v as "offline" | "qris" })}
            >
              <SelectTrigger id="method" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline">Offline (Tunai / Kasir Tata Usaha)</SelectItem>
                <SelectItem value="qris">QRIS (Transfer / Aplikasi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-semibold text-slate-700">
              Catatan Transaksi (Opsional)
            </Label>
            <Input
              id="note"
              placeholder="Contoh: Diterima langsung oleh staf TU..."
              className="rounded-xl"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proof" className="text-xs font-semibold text-slate-700">
              Unggah Bukti Bayar (Opsional)
            </Label>
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 text-xs text-slate-600 transition-colors hover:border-emerald-primary hover:text-emerald-primary">
              <Upload className="h-4 w-4" strokeWidth={1.8} />
              <span className="truncate">
                {proof ? proof.name : "Pilih gambar bukti transfer..."}
              </span>
              <input
                id="proof"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setProof(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
      </Modal>

      {/* Modal Tolak Pembayaran */}
      <Modal
        isOpen={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="Tolak Pembayaran"
        footer={
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setRejectTarget(null)}
              disabled={reject.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={reject.isPending || !rejectTarget}
              onClick={() => rejectTarget && reject.mutate(rejectTarget)}
            >
              {reject.isPending ? "Memproses..." : "Tolak Pembayaran"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Sampaikan alasan penolakan agar orang tua santri mengetahui kekeliruan dokumen bukti
            bayar.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason" className="text-xs font-semibold text-slate-700">
              Alasan Penolakan
            </Label>
            <Input
              id="reject-reason"
              className="rounded-xl"
              value={rejectTarget?.reason ?? ""}
              onChange={(e) => setRejectTarget((t) => (t ? { ...t, reason: e.target.value } : t))}
              placeholder="Misal: Bukti buram, nominal tidak sesuai, rekening tujuan keliru"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Batalkan Pembayaran */}
      <Modal
        isOpen={voidTarget !== null}
        onClose={() => setVoidTarget(null)}
        title="Batalkan Pembayaran (Void)"
        footer={
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setVoidTarget(null)}
              disabled={voidPay.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={voidPay.isPending || !voidTarget}
              onClick={() => voidTarget && voidPay.mutate(voidTarget)}
            >
              {voidPay.isPending ? "Memproses..." : "Batalkan Transaksi"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Pembayaran akan dibatalkan, saldo tagihan santri dikembalikan, dan nomor kuitansi
              dinyatakan tidak berlaku lagi di sistem.
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="void-reason" className="text-xs font-semibold text-slate-700">
              Alasan Pembatalan
            </Label>
            <Input
              id="void-reason"
              className="rounded-xl"
              value={voidTarget?.reason ?? ""}
              onChange={(e) => setVoidTarget((t) => (t ? { ...t, reason: e.target.value } : t))}
              placeholder="Misal: Salah input nominal, double transaksi"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Pratinjau Bukti Bayar */}
      <Modal
        isOpen={viewProof !== null}
        onClose={() => setViewProof(null)}
        title="Bukti Transfer Pembayaran"
        size="lg"
        footer={
          <Button variant="outline" className="rounded-full" onClick={() => setViewProof(null)}>
            Tutup
          </Button>
        }
      >
        {viewProof && (
          <div className="flex flex-col items-center justify-center space-y-3 p-2">
            <img
              src={viewProof}
              alt="Bukti Transfer"
              className="max-h-[65vh] w-auto max-w-full rounded-2xl border border-slate-200 object-contain shadow-sm"
            />
            <p className="text-center text-xs text-slate-500">
              Pastikan tanggal transaksi, nama pemilik rekening pengirim, dan nominal transfer
              sesuai sebelum menyetujui.
            </p>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
