import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Banknote,
  CalendarDays,
  CalendarHeart,
  CreditCard,
  Download,
  PieChart,
  Printer,
  Scale,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getReportData } from "@/lib/api/reports";
import { useAuth } from "@/lib/useAuth";
import { rupiah } from "@/lib/format";
import { downloadWorkbook } from "@/lib/excel";
import { currentSemester, semesterFromKey, semesterOptions } from "@/lib/semester";
import { Button } from "@/components/ui/button";
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
import { StatCard, DonutCard, BreakdownCard } from "@/components/shared";

export const Route = createFileRoute("/_authenticated/laporan")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Laporan Keuangan — SPP Digital" },
      {
        name: "description",
        content:
          "Laporan per semester: uang offline vs aplikasi, SPP, non-SPP, event, infaq, dan pengeluaran.",
      },
      { property: "og:title", content: "Laporan Keuangan — SPP Digital" },
      { property: "og:description", content: "Laporan keuangan sekolah per semester." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Laporan,
});

function Row({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${accent ? "text-emerald-primary" : ""}`}>
        {rupiah(value)}
      </p>
    </div>
  );
}

function Laporan() {
  const { role, isAdmin, user } = useAuth();
  const options = semesterOptions();
  const [key, setKey] = useState(currentSemester().key);
  const semester = semesterFromKey(key);
  const [shown, setShown] = useState(10);

  const setSemester = (k: string) => {
    setKey(k);
    setShown(10);
  };

  const { data, isPending } = useQuery({
    queryKey: ["laporan", key],
    queryFn: async () => {
      const { payments, invoices, events, expenses } = await getReportData({
        data: { from: semester.from, to: semester.to },
      });

      const inv = new Map(invoices.map((i) => [i.id, i]));
      const pay = payments;
      const sumBy = (fn: (p: (typeof pay)[number]) => boolean) =>
        pay.filter(fn).reduce((s, p) => s + p.amount, 0);

      const perEvent = events.map((ev) => ({
        name: ev.name,
        total: sumBy((p) => {
          const i = p.invoice_id ? inv.get(p.invoice_id) : undefined;
          return i?.event_id === ev.id;
        }),
      }));

      const infaq = pay.reduce((s, p) => s + p.infaq_amount, 0);
      const offline = pay
        .filter((p) => p.method === "offline")
        .reduce((s, p) => s + p.amount + p.infaq_amount, 0);
      const qris = pay
        .filter((p) => p.method === "qris")
        .reduce((s, p) => s + p.amount + p.infaq_amount, 0);
      const keluar = expenses.reduce((s, e) => s + e.amount, 0);

      return {
        offline,
        qris,
        spp: sumBy((p) => inv.get(p.invoice_id ?? "")?.type === "spp"),
        nonSpp: sumBy((p) => inv.get(p.invoice_id ?? "")?.type === "non_spp"),
        event: sumBy((p) => inv.get(p.invoice_id ?? "")?.type === "event"),
        infaq,
        perEvent,
        keluar,
        masuk: offline + qris,
        saldo: offline + qris - keluar,
        expenses,
      };
    },
  });

  const exportExcel = async () => {
    if (!data) return;
    await downloadWorkbook(
      [
        ["Laporan Keuangan", `Semester ${semester.label}`],
        [],
        ["Sumber", "Nominal (Rp)"],
        ["Uang offline", data.offline],
        ["Uang aplikasi (QRIS)", data.qris],
        ["Total uang masuk", data.masuk],
        [],
        ["SPP", data.spp],
        ["Non-SPP", data.nonSpp],
        ["Event", data.event],
        ["Infaq", data.infaq],
        [],
        ["Rincian per event", ""],
        ...data.perEvent.map((e) => [e.name, e.total]),
        [],
        ["Pengeluaran", data.keluar],
        ["Saldo bersih", data.saldo],
      ],
      "Laporan",
      `laporan-${semester.key}.xlsx`,
    );
  };

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Laporan" user={user}>
        <EmptyState
          icon={PieChart}
          title="Halaman ini hanya untuk admin"
          description="Anda masuk sebagai orang tua. Laporan keuangan sekolah hanya bisa dilihat oleh admin."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      role={role === "superadmin" ? "superadmin" : "admin"}
      title="Laporan Keuangan"
      user={user}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="print:hidden">
          <PageHeaderCard
            title="Laporan Keuangan"
            description={`Semester ${semester.label}. Rekapitulasi kas masuk, distribusi pos pembiayaan, dan pembukuan pengeluaran.`}
            loading={isPending}
            docKey="spp-laporan"
            blocks={[
              {
                icon: Wallet,
                label: "Kas Masuk",
                value: rupiah(data?.masuk),
                active: true,
              },
              {
                icon: TrendingDown,
                label: "Total Pengeluaran",
                value: rupiah(data?.expenses?.reduce((s, e) => s + e.amount, 0)),
                active: true,
              },
              {
                icon: Scale,
                label: "Saldo Kas Bersih",
                value: rupiah(data?.saldo),
                active: true,
                pulse: true,
              },
            ]}
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full px-4 text-xs font-semibold gap-1.5 shadow-sm"
                  onClick={() => void exportExcel()}
                  disabled={!data}
                >
                  <Download className="h-4 w-4" />
                  <span>Ekspor Excel</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full px-4 text-xs font-semibold gap-1.5 shadow-sm"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak / PDF</span>
                </Button>
              </div>
            }
          />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm print:hidden flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-primary" />
            <span className="text-xs font-semibold text-slate-700">Pilih Periode Semester:</span>
          </div>
          <Select value={key} onValueChange={setSemester}>
            <SelectTrigger className="h-9 w-56 rounded-full border-slate-200 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  Semester {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden print:block">
          <h1 className="text-2xl font-semibold">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground">Semester {semester.label}</p>
        </div>

        {isPending ? (
          <div className="grid place-items-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Uang Masuk"
                value={rupiah(data?.masuk)}
                icon={Wallet}
                chip="bg-emerald-500"
                iconText="text-white"
              />
              <StatCard
                label="Uang Offline (Kasir)"
                value={rupiah(data?.offline)}
                icon={Banknote}
                chip="bg-blue-500"
                iconText="text-white"
              />
              <StatCard
                label="Uang Aplikasi (QRIS)"
                value={rupiah(data?.qris)}
                icon={CreditCard}
                chip="bg-amber-500"
                iconText="text-white"
              />
              <StatCard
                label="Saldo Kas Bersih"
                value={rupiah(data?.saldo)}
                icon={Scale}
                chip="bg-emerald-700"
                iconText="text-white"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <DonutCard
                title="Komposisi Sumber Uang Masuk"
                description={`Distribusi penerimaan Semester ${semester.label}`}
                icon={PieChart}
                items={[
                  { label: "SPP", value: data?.spp ?? 0, color: "#1A6B47" },
                  { label: "Non-SPP", value: data?.nonSpp ?? 0, color: "#3B82F6" },
                  { label: "Event", value: data?.event ?? 0, color: "#8B5CF6" },
                  { label: "Infaq", value: data?.infaq ?? 0, color: "#D4A853" },
                ]}
                emptyText="Belum ada data uang masuk semester ini"
              />
              <BreakdownCard
                title="Penerimaan per Event / Kegiatan"
                description="Rincian penerimaan kegiatan sekolah semester ini"
                icon={CalendarHeart}
                rows={(data?.perEvent ?? []).map((e) => ({
                  id: e.name,
                  label: e.name,
                  total: e.total,
                }))}
                total={data?.event ?? 0}
              />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-sm font-bold">Rincian Pengeluaran Operasional</h2>
              <div className="mt-3">
                {(data?.expenses ?? []).slice(0, shown).map((e) => (
                  <Row key={e.id} label={`${e.title} · ${e.category ?? "umum"}`} value={e.amount} />
                ))}
                {(data?.expenses ?? []).length === 0 && (
                  <p className="py-4 text-sm text-muted-foreground">
                    Belum ada pengeluaran di semester ini.
                  </p>
                )}
                {(data?.expenses ?? []).length > shown && (
                  <button
                    type="button"
                    className="mt-1 text-xs font-medium text-emerald-primary hover:underline"
                    onClick={() => setShown((n) => n + 10)}
                  >
                    Lihat {Math.min(10, (data?.expenses ?? []).length - shown)} lagi
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
