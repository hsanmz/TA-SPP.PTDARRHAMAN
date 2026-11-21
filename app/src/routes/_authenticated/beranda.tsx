import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import {
  Activity,
  CalendarDays,
  CalendarSync,
  Clock,
  CreditCard,
  FileText,
  Scale,
  Sparkles,
  TrendingDown,
  Upload,
  Users,
  Wallet,
} from "lucide-react"

import { AppShell } from "@/components/AppShell"
import {
  dashboardSummary,
  monthlyTrend,
  generateSppInvoices,
  parentDashboard,
} from "@/lib/api/dashboard"
import { listAuditLogs } from "@/lib/api/audit"
import { getSchoolProfile, submitPayment } from "@/lib/api/payments"
import { fileToDataUrl } from "@/lib/proof"
import { useAuth } from "@/lib/useAuth"
import { rupiah, tanggal, BULAN } from "@/lib/format"
import { currentSemester } from "@/lib/semester"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoader } from "@/components/ui/page-loader"
import {
  PageHeaderCard,
  StatCard,
  AttentionCard,
  DonutCard,
  BreakdownCard,
  ActivityLogsCard,
  GrowthChartCard,
  PaymentStatusBadge,
  type AttentionItem,
  type DonutItem,
  type BreakdownRow,
} from "@/components/shared"

export const Route = createFileRoute("/_authenticated/beranda")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Beranda — SPP Digital" },
      {
        name: "description",
        content: "Ringkasan tagihan, penerimaan, dan pengeluaran sekolah dalam satu layar.",
      },
      { property: "og:title", content: "Beranda — SPP Digital" },
      {
        property: "og:description",
        content: "Ringkasan tagihan, penerimaan, dan pengeluaran sekolah.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Beranda,
})

type Invoice = {
  id: string
  student_id: string
  type?: "spp" | "non_spp" | "event"
  title: string
  period_month?: number | null
  period_year?: number | null
  amount: number
  paid_amount: number
  status: string
  allow_installment: boolean
  created_at: Date
}

type DashboardSummary = {
  students: number
  outstanding: number
  masuk: number
  qris: number
  offline: number
  infaq: number
  keluar: number
  pending?: number
}

const GANJIL = [7, 8, 9, 10, 11, 12]
const GENAP = [1, 2, 3, 4, 5, 6]

function Beranda() {
  const { role, user, loading, isAdmin } = useAuth()
  const semester = currentSemester()
  const [generating, setGenerating] = useState(false)
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)

  const admin = useQuery({
    queryKey: ["beranda-admin", semester.key, user?.id],
    enabled: isAdmin,
    queryFn: async () => {
      const [summary, trend] = await Promise.all([
        dashboardSummary({ data: { from: semester.from, to: semester.to } }),
        monthlyTrend({ data: { months: 6 } }),
      ])
      return {
        summary: summary as unknown as DashboardSummary,
        trend,
      }
    },
  })

  const audit = useQuery({
    queryKey: ["recent-audit-beranda", user?.id],
    enabled: isAdmin,
    queryFn: () => listAuditLogs({ data: { page: 1, pageSize: 5 } }),
  })

  const parent = useQuery({
    queryKey: ["beranda-parent", user?.id],
    enabled: role === "parent",
    queryFn: () => parentDashboard(),
  })

  const generateSpp = async () => {
    setGenerating(true)
    const now = new Date()
    try {
      const count = await generateSppInvoices({
        data: { year: now.getFullYear(), month: now.getMonth() + 1 },
      })
      toast.success(`${count ?? 0} tagihan SPP bulan ini dibuat`)
      void admin.refetch()
    } catch (e) {
      toast.error("Gagal membuat tagihan: " + (e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <PageLoader />

  const growthData = (admin.data?.trend ?? []).map((t) => ({
    date: `${BULAN[Number(t.month.slice(5, 7)) - 1] ?? t.month} ${t.month.slice(0, 4)}`,
    total: t.total,
  }))

  const rawTrend = admin.data?.trend ?? []
  let deltaPct: number | null = null
  if (rawTrend.length >= 2) {
    const curr = rawTrend[rawTrend.length - 1]?.total ?? 0
    const prev = rawTrend[rawTrend.length - 2]?.total ?? 0
    if (prev > 0) {
      deltaPct = Math.round(((curr - prev) / prev) * 100)
    }
  }

  const masuk = admin.data?.summary.masuk ?? 0
  const keluar = admin.data?.summary.keluar ?? 0
  const saldo = masuk - keluar
  const pendingCount = admin.data?.summary.pending ?? 0

  const attentionItems: AttentionItem[] = [
    {
      label: "Pembayaran menunggu verifikasi",
      value: pendingCount,
      icon: Clock,
      tone: "amber",
      href: "/pembayaran",
    },
    {
      label: "Tagihan santri belum lunas",
      value: (admin.data?.summary.outstanding ?? 0) > 0 ? 1 : 0,
      icon: FileText,
      tone: "blue",
      href: "/tagihan",
    },
    {
      label: "Pengeluaran kas tercatat",
      value: keluar > 0 ? 1 : 0,
      icon: TrendingDown,
      tone: "red",
      href: "/pengeluaran",
    },
    {
      label: "Santri aktif terdaftar",
      value: admin.data?.summary.students ?? 0,
      icon: Users,
      tone: "emerald",
      href: "/siswa",
    },
  ]

  const donutItems: DonutItem[] = [
    {
      label: "QRIS Online",
      value: admin.data?.summary.qris ?? 0,
      color: "#10B981",
    },
    {
      label: "Kasir / Tunai",
      value: admin.data?.summary.offline ?? 0,
      color: "#3B82F6",
    },
    {
      label: "Infaq Santri",
      value: admin.data?.summary.infaq ?? 0,
      color: "#D4A853",
    },
  ]

  const breakdownRows: BreakdownRow[] = [
    {
      id: "masuk",
      label: "Penerimaan Kas Masuk",
      sub: "QRIS + Kasir + Infaq",
      total: masuk,
    },
    {
      id: "keluar",
      label: "Pengeluaran Kas",
      sub: "Biaya operasional & kegiatan",
      total: keluar,
    },
    {
      id: "saldo",
      label: "Saldo Kas Tersedia",
      sub: "Penerimaan minus pengeluaran",
      total: Math.max(0, saldo),
    },
  ]

  const recentLogs = (audit.data?.rows ?? []).map((r) => ({
    id: String(r.id),
    action: r.action,
    entity_type: r.entity_type || "system",
    user_username: r.full_name || r.username || "Admin",
    created_at: String(r.created_at),
  }))

  return (
    <AppShell
      role={role === "superadmin" ? "superadmin" : isAdmin ? "admin" : "parent"}
      title="Beranda"
      user={user}
    >
      <div className="space-y-6">
        {isAdmin ? (
          <>
            {/* 1. PageHeaderCard Component ala apps/ppdb */}
            <PageHeaderCard
              title="Dashboard Admin"
              description="Ringkasan operasional keuangan SPP, santri aktif, dan arus kas pesantren."
              docKey="spp-beranda"
              loading={admin.isPending}
              action={
                <Button
                  onClick={generateSpp}
                  disabled={generating}
                  className="h-10 rounded-full bg-primary hover:bg-emerald-dark px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm text-white"
                >
                  <CalendarSync className="h-4 w-4" />
                  <span>Buat Tagihan SPP</span>
                </Button>
              }
              blocks={[
                {
                  icon: CalendarDays,
                  label: "Semester Aktif",
                  value: `Semester ${semester.label}`,
                  active: true,
                },
                {
                  icon: Activity,
                  label: "Status Kas Operasional",
                  value: saldo >= 0 ? "Surplus Kas" : "Defisit Kas",
                  active: true,
                  pulse: true,
                },
                {
                  icon: Users,
                  label: "Santri Terdaftar",
                  value: `${admin.data?.summary.students ?? 0} Santri`,
                  active: true,
                },
              ]}
            />

            {/* 2. Stat Cards Metrik ala apps/ppdb (4-column grid) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Santri Aktif"
                value={String(admin.data?.summary.students ?? 0)}
                icon={Users}
                chip="bg-blue-500"
                iconText="text-white"
                to="/siswa"
              />
              <StatCard
                label="Kas Masuk (Semester Ini)"
                value={rupiah(masuk)}
                sub={`Aplikasi (QRIS) ${rupiah(admin.data?.summary.qris)}`}
                icon={Wallet}
                chip="bg-emerald-500"
                iconText="text-white"
                to="/pembayaran"
              />
              <StatCard
                label="Menunggu Verifikasi"
                value={`${pendingCount} Transaksi`}
                sub={
                  pendingCount > 0
                    ? "Ada pembayaran butuh konfirmasi"
                    : "Semua pembayaran selesai"
                }
                icon={Clock}
                chip="bg-amber-500"
                iconText="text-white"
                actionable={pendingCount > 0}
                actionableText="Perlu Proses"
                to="/pembayaran"
              />
              <StatCard
                label="Tagihan Belum Lunas"
                value={rupiah(admin.data?.summary.outstanding)}
                icon={FileText}
                chip="bg-rose-500"
                iconText="text-white"
                to="/tagihan"
              />
            </div>

            {/* 3. Bento Grid: Growth Chart & Attention Card */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <GrowthChartCard
                  title="Trend Penerimaan 6 Bulan"
                  description="Total pembayaran terkonfirmasi termasuk infaq santri"
                  data={growthData}
                  deltaPct={deltaPct}
                  deltaLabel="vs bulan sebelumnya"
                  loading={admin.isPending}
                />
              </div>
              <div className="lg:col-span-1">
                <AttentionCard
                  title="Perlu Perhatian"
                  description="Item yang membutuhkan tindakan admin"
                  items={attentionItems}
                  loading={admin.isPending}
                />
              </div>
            </div>

            {/* 4. Distribution Cards: Donut, Breakdown, Activity Log */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <DonutCard
                title="Komposisi Kas Masuk"
                description="Distribusi pembayaran berdasarkan metode"
                icon={CreditCard}
                items={donutItems}
                emptyText="Belum ada data penerimaan kas."
              />
              <BreakdownCard
                title="Arus Kas Keuangan"
                description="Perbandingan penerimaan, pengeluaran, dan piutang"
                icon={Scale}
                rows={breakdownRows}
                total={masuk + keluar + (admin.data?.summary.outstanding ?? 0)}
              />
              <ActivityLogsCard
                logs={recentLogs}
                loading={audit.isPending}
                manageLink="/pengguna"
                manageLabel="Kelola Log & Pengguna"
              />
            </div>
          </>
        ) : (
          /* Parent Dashboard View */
          <>
            <PageHeaderCard
              title="Tagihan Anak Anda"
              description={`Semester ${semester.label}`}
              loading={parent.isPending}
            />

            {(parent.data?.students ?? []).length === 0 &&
            (parent.data?.invoices ?? []).length === 0 &&
            !parent.isPending ? (
              <EmptyState
                icon={FileText}
                title="Belum ada tagihan"
                description="Tagihan SPP dan event untuk anak Anda akan muncul di sini setelah admin membuatnya."
              />
            ) : null}

            {(parent.data?.students ?? []).length > 0 && (
              <div className="space-y-6">
                {(parent.data?.students ?? []).map((s) => {
                  const studentInvoices = (parent.data?.invoices ?? []).filter(
                    (i) => i.student_id === s.id,
                  )
                  const sisa = studentInvoices
                    .filter((i) => i.status === "unpaid" || i.status === "partial")
                    .reduce((sum, i) => sum + (i.amount - i.paid_amount), 0)

                  const nowYear = new Date().getFullYear()
                  const sppInvoices = studentInvoices.filter(
                    (i) =>
                      (!i.type || i.type === "spp") &&
                      (i.period_year === null || i.period_year === nowYear),
                  )

                  const sppByMonth = (m: number) => sppInvoices.find((i) => i.period_month === m)

                  const renderMonthCell = (m: number) => {
                    const inv = sppByMonth(m)
                    if (!inv) {
                      return (
                        <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-center">
                          <p className="text-[11px] font-medium text-slate-500">{BULAN[m - 1]}</p>
                          <p className="text-[11px] text-slate-400">—</p>
                        </div>
                      )
                    }
                    const isPaid = inv.status === "paid"
                    const isPartial = inv.status === "partial"
                    const badgeClass = isPaid
                      ? "border-emerald-primary/30 bg-emerald-light/60 text-emerald-primary"
                      : isPartial
                        ? "border-gold-accent/40 bg-gold-bg text-gold-dark"
                        : "border-slate-200 bg-white text-slate-600"
                    return (
                      <div
                        className={`flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center transition-shadow ${badgeClass}`}
                      >
                        <p className="text-[11px] font-medium">{BULAN[m - 1]}</p>
                        <p className="font-mono text-xs font-bold">
                          {isPaid ? "Lunas" : isPartial ? "Cicilan" : "Belum"}
                        </p>
                        <p className="text-[10px] tabular-nums opacity-80">
                          {rupiah(inv.paid_amount)}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <p className="font-heading text-lg font-bold text-slate-900">
                            {s.full_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            NIS {s.nis} · {s.class_name ?? "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Sisa Tagihan Belum Dibayar</p>
                          <p className="text-xl font-bold tabular-nums text-rose-danger">
                            {rupiah(sisa)}
                          </p>
                        </div>
                      </div>

                      {/* Status SPP 12 Bulan (Tahun Berjalan) */}
                      <div className="mt-4 space-y-3">
                        <h3 className="font-heading text-xs font-bold tracking-wide uppercase text-slate-600">
                          Peta Status SPP 12 Bulan ({nowYear})
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                            <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                              Semester Ganjil (Juli – Desember)
                            </p>
                            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                              {GANJIL.map((m) => renderMonthCell(m))}
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                            <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                              Semester Genap (Januari – Juni)
                            </p>
                            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                              {GENAP.map((m) => renderMonthCell(m))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Daftar Tagihan */}
                      <div className="mt-5 space-y-2">
                        <h3 className="font-heading text-xs font-bold tracking-wide uppercase text-slate-600">
                          Rincian Tagihan
                        </h3>
                        {studentInvoices.length === 0 ? (
                          <p className="text-xs text-slate-400">Belum ada tagihan.</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {studentInvoices.map((inv) => {
                              const sisaItem = inv.amount - inv.paid_amount
                              const lunas = inv.status === "paid"
                              return (
                                <div
                                  key={inv.id}
                                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {inv.title}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {inv.period_month
                                        ? `${BULAN[inv.period_month - 1]} ${inv.period_year ?? ""}`
                                        : "Non-bulanan"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-mono text-sm font-semibold tabular-nums">
                                        {rupiah(inv.amount)}
                                      </p>
                                      {!lunas && inv.paid_amount > 0 && (
                                        <p className="text-[11px] text-slate-500">
                                          Sisa: {rupiah(sisaItem)}
                                        </p>
                                      )}
                                    </div>
                                    <PaymentStatusBadge status={inv.status} label={lunas ? "Lunas" : inv.status === "partial" ? "Cicilan" : "Belum Bayar"} />
                                    {!lunas && (
                                      <Button size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => setPayInvoice(inv as Invoice)}>
                                        Bayar
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {payInvoice && (
        <PayModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onSuccess={() => {
            setPayInvoice(null)
            void parent.refetch()
          }}
        />
      )}
    </AppShell>
  )
}

function PayModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice
  onClose: () => void
  onSuccess: () => void
}) {
  const [method, setMethod] = useState<"qris" | "offline">("qris")
  const [amount, setAmount] = useState<string>(
    String(invoice.allow_installment ? 50000 : invoice.amount - invoice.paid_amount),
  )
  const [infaq, setInfaq] = useState<string>("0")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const profile = useQuery({
    queryKey: ["school-profile-pay"],
    queryFn: () => getSchoolProfile(),
  })

  const sisa = invoice.amount - invoice.paid_amount
  const numAmount = Number(amount) || 0
  const numInfaq = Number(infaq) || 0
  const grandTotal = numAmount + numInfaq

  const submit = async () => {
    if (numAmount <= 0) {
      toast.error("Nominal pembayaran harus lebih dari 0")
      return
    }
    if (numAmount > sisa) {
      toast.error(`Nominal melebihi sisa tagihan (${rupiah(sisa)})`)
      return
    }
    if (!invoice.allow_installment && numAmount !== sisa) {
      toast.error(`Tagihan ini tidak memperbolehkan cicilan. Harus bayar penuh ${rupiah(sisa)}`)
      return
    }
    if (method === "offline" && !proofFile) {
      toast.error("Wajib mengunggah bukti transfer / pembayaran")
      return
    }

    setSubmitting(true)
    try {
      let proofUrl: string | undefined
      if (proofFile) {
        proofUrl = await fileToDataUrl(proofFile)
      }
      await submitPayment({
        data: {
          invoice_id: invoice.id,
          method,
          amount: numAmount,
          infaq_amount: numInfaq,
          proof_url: proofUrl,
          note: notes.trim() || undefined,
        },
      })
      toast.success(
        method === "qris"
          ? "Pembayaran berhasil diproses"
          : "Bukti transfer berhasil diajukan, menunggu konfirmasi admin",
      )
      onSuccess()
    } catch (e) {
      toast.error("Gagal memproses pembayaran: " + (e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Bayar: ${invoice.title}`}
      description={`Sisa tagihan yang harus dibayar: ${rupiah(sisa)}`}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Metode Pembayaran</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("qris")}
              className={`rounded-xl border p-3 text-left transition-all ${
                method === "qris"
                  ? "border-emerald-primary bg-emerald-light/40 ring-2 ring-emerald-primary/20"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <p className="font-heading text-sm font-bold text-slate-900">QRIS Instan</p>
              <p className="text-[11px] text-slate-500">Konfirmasi otomatis</p>
            </button>
            <button
              type="button"
              onClick={() => setMethod("offline")}
              className={`rounded-xl border p-3 text-left transition-all ${
                method === "offline"
                  ? "border-emerald-primary bg-emerald-light/40 ring-2 ring-emerald-primary/20"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <p className="font-heading text-sm font-bold text-slate-900">Transfer Bank</p>
              <p className="text-[11px] text-slate-500">Manual / unggah bukti</p>
            </button>
          </div>
        </div>

        {method === "offline" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <Label className="text-xs font-semibold text-slate-700">Rekening Tujuan Sekolah</Label>
            {profile.data?.bank_account_number ? (
              <div className="mt-1 text-xs text-slate-800">
                <span className="font-bold">{profile.data.bank_name || "Bank"}</span> —{" "}
                <span className="font-mono font-semibold">{profile.data.bank_account_number}</span>{" "}
                a.n. <span className="font-semibold">{profile.data.bank_account_name || "Sekolah"}</span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-amber-600">
                Hubungi tata usaha sekolah untuk konfirmasi rekening transfer.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">
              Nominal Bayar (Rp) {invoice.allow_installment && <span className="text-slate-400">· bisa dicicil</span>}
            </Label>
            <Input
              type="number"
              min={10000}
              max={sisa}
              step={10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!invoice.allow_installment}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Infaq Sukarela (Rp)</Label>
            <Input
              type="number"
              min={0}
              step={5000}
              value={infaq}
              onChange={(e) => setInfaq(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {method === "qris" ? (
          <div className="rounded-2xl border border-emerald-primary/20 bg-emerald-light/30 p-4 text-center">
            <p className="text-xs text-slate-600">Total yang harus dibayar:</p>
            <p className="font-mono text-2xl font-bold text-emerald-primary">
              {rupiah(grandTotal)}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Setelah menekan Bayar, sistem simulasi QRIS akan memvalidasi pembayaran Anda secara instan.
            </p>
          </div>
        ) : (
          <div>
            <Label className="text-xs">Unggah Bukti Transfer</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {proofFile && (
              <p className="mt-1 text-[11px] text-slate-500">File: {proofFile.name}</p>
            )}
          </div>
        )}

        <div>
          <Label className="text-xs">Catatan Tambahan (opsional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Titipan SPP bulan Agustus"
            className="mt-1"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Memproses..." : `Bayar ${rupiah(grandTotal)}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
