import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CalendarHeart,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { createEvent, listEvents } from "@/lib/api/events";
import { listInvoices } from "@/lib/api/invoices";
import { useAuth } from "@/lib/useAuth";
import { rupiah, tanggal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import PageHeaderCard from "@/components/shared/PageHeaderCard";
import ToolbarCard from "@/components/shared/ToolbarCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/event")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Event — SPP Digital" },
      {
        name: "description",
        content: "Daftar event sekolah, target dana, dan progres pembayaran siswa.",
      },
      { property: "og:title", content: "Event — SPP Digital" },
      {
        property: "og:description",
        content: "Daftar event sekolah, target dana, dan progres pembayaran siswa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventPage,
});

const empty = { name: "", description: "", total_amount: "", deadline: "" };

function addMonths(d: Date, m: number) {
  const c = new Date(d);
  c.setMonth(c.getMonth() + m);
  return c;
}

function EventPage() {
  const { role, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [search, setSearch] = useState("");

  const {
    data: events = [],
    isPending,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  });

  const { data: invData } = useQuery({
    queryKey: ["invoices-all-events"],
    queryFn: () =>
      listInvoices({ data: { page: 1, pageSize: 1000, type: "event", status: "all" } }),
  });
  const invoices = invData?.rows ?? [];

  const create = useMutation({
    mutationFn: () =>
      createEvent({
        data: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          total_amount: Number(form.total_amount || 0),
          deadline: form.deadline ? form.deadline : null,
          target: "all",
        },
      }),
    onSuccess: () => {
      toast.success("Event baru berhasil dibuat");
      setOpen(false);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["events"] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Event" user={user}>
        <EmptyState
          icon={CalendarHeart}
          title="Tagihan event anak ada di Beranda"
          description="Halaman ini khusus admin. Tagihan event untuk anak Anda tampil dan bisa dibayar dari Beranda."
        />
      </AppShell>
    );
  }

  const filteredEvents = events.filter(
    (ev) =>
      ev.name.toLowerCase().includes(search.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(search.toLowerCase())),
  );

  const totalCollected = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const totalTarget = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalParticipants = invoices.length;

  return (
    <AppShell role={role === "superadmin" ? "superadmin" : "admin"} title="Event" user={user}>
      <div className="space-y-6 animate-fade-in">
        {/* PageHeaderCard ala project-ppdb */}
        <PageHeaderCard
          title="Event & Kegiatan Santri"
          description="Manajemen anggaran kegiatan santri, rihlah, wisuda tahfidz, dan monitoring pembayaran cicilan."
          loading={isPending}
          docKey="spp-event"
          action={
            <Button
              onClick={() => {
                setForm({ ...empty });
                setOpen(true);
              }}
              className="h-10 rounded-full px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Event Baru</span>
            </Button>
          }
          blocks={[
            {
              icon: CalendarHeart,
              label: "Total Event",
              value: `${events.length} kegiatan`,
              active: true,
            },
            {
              icon: Banknote,
              label: "Dana Terkumpul",
              value: rupiah(totalCollected),
              active: true,
              pulse: true,
            },
            {
              icon: Users,
              label: "Peserta Terdaftar",
              value: `${totalParticipants} santri`,
              active: true,
            },
          ]}
        />

        {/* Toolbar Pencarian & Refresh */}
        <ToolbarCard
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={(e) => e.preventDefault()}
          searchPlaceholder="Cari nama event atau deskripsi kegiatan..."
          onRefresh={() => void refetch()}
          refreshing={isFetching}
        />

        {/* Grid Event Cards ala project-ppdb */}
        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="h-48 animate-pulse rounded-2xl border-slate-100 bg-slate-50/70 p-5"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="rounded-2xl border-slate-100 p-8 text-center bg-white shadow-sm">
            <EmptyState
              icon={CalendarHeart}
              title={search ? "Tidak ada event yang cocok" : "Belum ada event kegiatan"}
              description={
                search
                  ? "Coba gunakan kata kunci pencarian yang lain."
                  : "Buat event sekolah pertama Anda, tetapkan target biaya per santri, dan pantau pembayarannya."
              }
              actionLabel={search ? undefined : "Buat Event Baru"}
              onAction={search ? undefined : () => setOpen(true)}
            />
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((ev) => {
              const inv = invoices.filter((i) => i.event_id === ev.id);
              const target = inv.reduce((s, i) => s + i.amount, 0);
              const paid = inv.reduce((s, i) => s + i.paid_amount, 0);
              const pct = target > 0 ? Math.min(100, Math.round((paid / target) * 100)) : 0;
              const isPastDeadline = ev.deadline && new Date(ev.deadline).getTime() < Date.now();

              return (
                <Card
                  key={ev.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {ev.name}
                        </h3>
                        <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">
                          {ev.description || "Tidak ada catatan keterangan."}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-100"
                      >
                        <Users className="h-3 w-3" />
                        <span>{inv.length}</span>
                      </Badge>
                    </div>

                    {/* Progress Bar & Nominal */}
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100/80 space-y-2">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Terkumpul</span>
                        <span className="font-mono font-bold text-emerald-700">{rupiah(paid)}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Target: {rupiah(target)}</span>
                        <span className="font-semibold text-slate-700">{pct}%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Biaya per santri:</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {rupiah(ev.total_amount)}
                        </span>
                      </div>
                      {ev.deadline && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Batas Waktu:</span>
                          <span
                            className={cn(
                              "font-medium",
                              isPastDeadline ? "text-amber-700" : "text-slate-700",
                            )}
                          >
                            {tanggal(ev.deadline)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Cicilan Didukung
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-semibold rounded-full gap-1 text-slate-700 hover:text-emerald-700 hover:bg-slate-50"
                    >
                      <Link to="/tagihan">
                        <span>Lihat Tagihan</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Buat Event Baru */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Buat Event Kegiatan Baru"
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
              disabled={create.isPending || !form.name || !form.total_amount}
            >
              {create.isPending ? "Membuat..." : "Simpan Event"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
              Nama Event / Kegiatan
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Wisuda Tahfidz Qur'an Angkatan VII"
              className="rounded-xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="total_amount" className="text-xs font-semibold text-slate-700">
              Biaya per Siswa (Rp)
            </Label>
            <Input
              id="total_amount"
              inputMode="numeric"
              placeholder="0"
              className="rounded-xl font-mono"
              value={form.total_amount}
              onChange={(e) =>
                setForm({ ...form, total_amount: e.target.value.replace(/\D/g, "") })
              }
            />
            {form.total_amount && (
              <p className="text-[11px] text-emerald-700 font-semibold">
                {rupiah(Number(form.total_amount))} per santri
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadline" className="text-xs font-semibold text-slate-700">
              Batas Waktu Pelunasan (Deadline)
            </Label>
            <Input
              id="deadline"
              type="date"
              className="rounded-xl"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Santri tetap dapat menyicil tagihan hingga 3 bulan setelah tanggal batas waktu.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Keterangan / Rincian Kegiatan (Opsional)
            </Label>
            <Input
              id="description"
              placeholder="Rincian fasilitas, perlengkapan, lokasi kegiatan..."
              className="rounded-xl"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
