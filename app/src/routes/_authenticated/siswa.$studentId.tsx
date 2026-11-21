import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  GraduationCap,
  Phone,
  School,
  UserCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getStudent } from "@/lib/api/students";
import { detailStudentInvoices } from "@/lib/api/invoices";
import { useAuth } from "@/lib/useAuth";
import { rupiah, tanggal, BULAN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import PageHeaderCard from "@/components/shared/PageHeaderCard";
import PaymentStatusBadge from "@/components/shared/PaymentStatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/siswa/$studentId")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Detail Siswa — SPP Digital` },
      { name: "description", content: `Riwayat SPP dan tagihan santri ${params.studentId}.` },
      { property: "og:title", content: "Detail Siswa — SPP Digital" },
      { property: "og:description", content: "Riwayat SPP dan tagihan santri." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SiswaDetail,
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

type Invoice = {
  id: string;
  type: "spp" | "non_spp" | "event";
  title: string;
  event_id: string | null;
  period_month: number | null;
  period_year: number | null;
  amount: number;
  paid_amount: number;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  created_at: Date;
};

const GANJIL = [7, 8, 9, 10, 11, 12];
const GENAP = [1, 2, 3, 4, 5, 6];

const STATUS_LABEL: Record<Invoice["status"], string> = {
  unpaid: "Belum Bayar",
  partial: "Cicilan",
  paid: "Lunas",
  cancelled: "Dibatalkan",
};

const TYPE_LABEL: Record<Invoice["type"], string> = {
  spp: "SPP Bulanan",
  non_spp: "Non-SPP",
  event: "Kegiatan / Event",
};

function SiswaDetail() {
  const { role, isAdmin, user } = useAuth();
  const { studentId } = Route.useParams();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudent({ data: { id: studentId } }),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["student-invoices", studentId],
    queryFn: () => detailStudentInvoices({ data: { studentId } }),
  });

  const yearInvoices = invoices.filter((i) => i.period_year === null || i.period_year === year);

  const availableYears = [
    ...new Set([
      currentYear,
      currentYear - 1,
      ...invoices.map((i) => i.period_year).filter((y): y is number => typeof y === "number"),
    ]),
  ].sort((a, b) => b - a);

  const sppByMonth = (m: number) =>
    yearInvoices.find((i) => i.type === "spp" && i.period_month === m && i.period_year === year);

  const cell = (m: number) => {
    const inv = sppByMonth(m);
    if (!inv) {
      return (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
          <p className="text-xs font-semibold text-slate-500">{BULAN[m - 1]}</p>
          <p className="text-xs text-slate-400 font-mono">—</p>
        </div>
      );
    }
    const isPaid = inv.status === "paid";
    const isPartial = inv.status === "partial";
    const isCancelled = inv.status === "cancelled";

    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all",
          isPaid
            ? "border-emerald-200 bg-emerald-50/50 text-emerald-800"
            : isPartial
              ? "border-amber-200 bg-amber-50/50 text-amber-800"
              : isCancelled
                ? "border-slate-200 bg-slate-50 text-slate-400"
                : "border-slate-150 bg-white text-slate-700 shadow-2xs",
        )}
      >
        <p className="text-xs font-semibold">{BULAN[m - 1]}</p>
        <span
          className={cn(
            "text-xs font-bold font-mono",
            isPaid
              ? "text-emerald-700"
              : isPartial
                ? "text-amber-700"
                : isCancelled
                  ? "text-rose-500 line-through"
                  : "text-slate-500",
          )}
        >
          {isPaid ? "Lunas" : isPartial ? "Cicilan" : isCancelled ? "Batal" : "Belum"}
        </span>
        <p className="text-[10px] tabular-nums font-mono text-slate-500">
          {rupiah(inv.paid_amount)}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Detail Siswa" user={user}>
        <EmptyState
          icon={UserRound}
          title="Halaman ini hanya untuk admin"
          description="Anda masuk sebagai orang tua. Detail data siswa hanya bisa diakses oleh admin sekolah."
        />
      </AppShell>
    );
  }

  if (!student) return null;

  const s = student as Student;
  const tagihanLain = yearInvoices.filter((i) => i.type !== "spp");

  return (
    <AppShell role={role === "superadmin" ? "superadmin" : "admin"} title={s.full_name} user={user}>
      <div className="space-y-6 animate-fade-in">
        {/* PageHeaderCard ala project-ppdb */}
        <PageHeaderCard
          title={s.full_name}
          description={`Biodata lengkap santri, status akademik, pemetaan tagihan SPP 12 bulan, dan riwayat tagihan kegiatan.`}
          docKey="spp-detail-siswa"
          action={
            <Button
              variant="outline"
              asChild
              className="h-10 rounded-full px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm"
            >
              <Link to="/siswa">
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Siswa</span>
              </Link>
            </Button>
          }
          blocks={[
            {
              icon: UserRound,
              label: "Nomor Induk (NIS)",
              value: s.nis,
              active: true,
            },
            {
              icon: School,
              label: "Kelas & Tingkat",
              value: s.class_name ? `Kelas ${s.class_name}` : "Belum ditentukan",
              active: !!s.class_name,
            },
            {
              icon: UserCheck,
              label: "Status Santri",
              value: s.status === "active" ? "Aktif Belajar" : s.status === "graduated" ? "Alumni" : "Nonaktif",
              active: s.status === "active",
              pulse: s.status === "active",
            },
          ]}
        />

        {/* Info Grid Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Kelas Akademik", value: s.class_name ? `Kelas ${s.class_name}` : "—", icon: School },
            { label: "Tingkat Pendidikan", value: s.grade_level ? `Tingkat ${s.grade_level}` : "—", icon: GraduationCap },
            { label: "Tahun Angkatan", value: s.cohort || "—", icon: CalendarDays },
            {
              label: "Jenis Kelamin",
              value: s.gender ? (s.gender.toUpperCase() === "L" ? "Laki-laki" : "Perempuan") : "—",
              icon: UserRound,
            },
            { label: "Kontak HP Wali", value: s.guardian_phone || "—", icon: Phone },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="rounded-2xl border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Icon className="h-4 w-4 text-emerald-primary" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{item.label}</span>
                </div>
                <p className="truncate text-sm font-bold text-slate-900">{item.value}</p>
              </Card>
            );
          })}
        </div>

        {/* Peta Tagihan SPP 12 Bulan */}
        <Card className="rounded-2xl border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-light text-emerald-primary ring-1 ring-emerald-primary/10">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Peta Tagihan SPP Bulanan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Status pelunasan SPP santri per bulan untuk tahun kalender {year}
                </p>
              </div>
            </div>

            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="h-9 w-36 rounded-full border-slate-200 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Tahun {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Semester Ganjil */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Semester Ganjil (Juli – Desember)
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Semester I
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {GANJIL.map((m) => (
                  <div key={m}>{cell(m)}</div>
                ))}
              </div>
            </div>

            {/* Semester Genap */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Semester Genap (Januari – Juni)
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Semester II
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {GENAP.map((m) => (
                  <div key={m}>{cell(m)}</div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tagihan Lain (Non-SPP dan Event) */}
        <Card className="rounded-2xl border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-200">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Tagihan Non-SPP & Kegiatan Santri
              </h3>
              <p className="text-xs text-muted-foreground">
                Rincian tagihan seragam, kitab kuning, wisuda, atau rihlah santri
              </p>
            </div>
          </div>

          {tagihanLain.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {tagihanLain.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{inv.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TYPE_LABEL[inv.type]} · Dibuat: {tanggal(inv.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {rupiah(inv.amount)}
                    </p>
                    <PaymentStatusBadge status={inv.status} label={STATUS_LABEL[inv.status]} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Tidak ada tagihan non-SPP atau kegiatan untuk santri ini.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
