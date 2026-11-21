import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CalendarDays,
  Plus,
  Receipt,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { createExpense, deleteExpense, listExpenses } from "@/lib/api/expenses";
import { useAuth } from "@/lib/useAuth";
import { rupiah, tanggal } from "@/lib/format";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import PageHeaderCard from "@/components/shared/PageHeaderCard";
import ToolbarCard from "@/components/shared/ToolbarCard";
import PaginationControls from "@/components/shared/PaginationControls";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pengeluaran")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pengeluaran — SPP Digital" },
      {
        name: "description",
        content: "Catat pengeluaran sekolah beserta kategori dan tanggalnya.",
      },
      { property: "og:title", content: "Pengeluaran — SPP Digital" },
      { property: "og:description", content: "Catat pengeluaran sekolah beserta kategori." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pengeluaran,
});

export const KATEGORI_PENGELUARAN = [
  "Bayar Listrik",
  "Sarapan & Konsumsi",
  "Bayar WiFi & Internet",
  "Kebutuhan Operasional",
  "Honor Pengajar / Ustadz",
  "Pemeliharaan Sarana",
  "Lainnya",
] as const;

const empty = {
  title: "",
  category: "Bayar Listrik",
  amount: "",
  spent_at: new Date().toISOString().slice(0, 10),
  note: "",
};

const PAGE_SIZE = 15;

function Pengeluaran() {
  const { role, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: expenses = [],
    isPending,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => listExpenses(),
  });

  const create = useMutation({
    mutationFn: () =>
      createExpense({
        data: {
          title: form.title.trim(),
          category: form.category.trim() || null,
          amount: Number(form.amount || 0),
          spent_at: form.spent_at,
          note: form.note.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Catatan pengeluaran berhasil disimpan");
      setOpen(false);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["expenses"] });
      void qc.invalidateQueries({ queryKey: ["beranda-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExpense({ data: { id } }),
    onSuccess: () => {
      toast.success("Pengeluaran berhasil dihapus");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["expenses"] });
      void qc.invalidateQueries({ queryKey: ["beranda-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  if (role && !isAdmin) {
    return (
      <AppShell role="parent" title="Pengeluaran" user={user}>
        <EmptyState
          icon={TrendingDown}
          title="Halaman ini hanya untuk admin"
          description="Anda masuk sebagai orang tua. Catatan pengeluaran sekolah hanya bisa dikelola oleh admin."
        />
      </AppShell>
    );
  }

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.title.toLowerCase().includes(q) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.note && e.note.toLowerCase().includes(q));
    const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categoriesCount = new Set(expenses.map((e) => e.category).filter(Boolean)).size;

  return (
    <AppShell role={role === "superadmin" ? "superadmin" : "admin"} title="Pengeluaran" user={user}>
      <div className="space-y-6 animate-fade-in">
        {/* PageHeaderCard ala project-ppdb */}
        <PageHeaderCard
          title="Pengeluaran Operasional"
          description="Monitoring arus kas keluar pesantren, beban utilitas, konsumsi santri, dan pemeliharaan fasilitas."
          loading={isPending}
          docKey="spp-pengeluaran"
          action={
            <Button
              onClick={() => {
                setForm({ ...empty });
                setOpen(true);
              }}
              className="h-10 rounded-full px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Pengeluaran</span>
            </Button>
          }
          blocks={[
            {
              icon: TrendingDown,
              label: "Total Beban Kas",
              value: rupiah(total),
              active: true,
            },
            {
              icon: Receipt,
              label: "Catatan Pembukuan",
              value: `${expenses.length} transaksi`,
              active: true,
            },
            {
              icon: Tag,
              label: "Kategori Pengeluaran",
              value: `${categoriesCount} kategori`,
              active: true,
            },
          ]}
        />

        {/* Toolbar Pencarian & Filter Kategori */}
        <ToolbarCard
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSearchSubmit={(e) => e.preventDefault()}
          searchPlaceholder="Cari keperluan, kategori, atau catatan pengeluaran..."
          onRefresh={() => void refetch()}
          refreshing={isFetching}
          searchActions={
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-fit sm:w-48 rounded-full border-slate-200 text-xs">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {KATEGORI_PENGELUARAN.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Tabel Data Pengeluaran */}
        <Card className="overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead className="bg-emerald-primary/5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Keperluan & Keterangan</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Kategori</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Tanggal Keluar</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Nominal Biaya</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isPending ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td colSpan={5} className="py-4 px-4 h-14 bg-slate-50/50" />
                      </tr>
                    ))
                  ) : shown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12">
                        <EmptyState
                          icon={TrendingDown}
                          title={search ? "Tidak ada pengeluaran yang cocok" : "Belum ada catatan pengeluaran"}
                          description={
                            search
                              ? "Coba sesuaikan kata kunci pencarian atau ubah filter kategori."
                              : "Catat pengeluaran kas sekolah agar pembukuan neraca saldo berjalan seimbang dan akurat."
                          }
                          actionLabel={search ? undefined : "Tambah Pengeluaran"}
                          onAction={search ? undefined : () => setOpen(true)}
                        />
                      </td>
                    </tr>
                  ) : (
                    shown.map((e) => (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {e.title}
                          </div>
                          {e.note && <div className="text-xs text-muted-foreground mt-0.5">{e.note}</div>}
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium border-slate-200 bg-slate-50 text-slate-700 rounded-full px-2.5 py-0.5"
                          >
                            {e.category || "Umum"}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {tanggal(e.spent_at)}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-rose-danger whitespace-nowrap">
                          -{rupiah(e.amount)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs rounded-lg text-rose-danger hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setDeleteId(e.id)}
                            title="Hapus catatan pengeluaran"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isPending && filtered.length > 0 && (
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah Pengeluaran */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Catat Pengeluaran Baru"
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
              disabled={create.isPending || !form.title || !form.amount}
            >
              {create.isPending ? "Menyimpan..." : "Simpan Pengeluaran"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Keperluan / Judul Pengeluaran
            </Label>
            <Input
              id="title"
              placeholder="Contoh: Tagihan Listrik Gedung Asrama Santri"
              className="rounded-xl"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                Kategori
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger id="category" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_PENGELUARAN.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="spent_at" className="text-xs font-semibold text-slate-700">
                Tanggal Pengeluaran
              </Label>
              <Input
                id="spent_at"
                type="date"
                className="rounded-xl"
                value={form.spent_at}
                onChange={(e) => setForm({ ...form, spent_at: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
              Nominal Pengeluaran (Rp)
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
              <p className="text-[11px] text-rose-danger font-semibold">
                -{rupiah(Number(form.amount))}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-semibold text-slate-700">
              Catatan Tambahan (Opsional)
            </Label>
            <Input
              id="note"
              placeholder="No invoice PLN, penerima dana, dsb."
              className="rounded-xl"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus Catatan Pengeluaran?"
        message="Catatan pengeluaran ini akan dihapus secara permanen dari buku kas operasional sekolah."
        confirmLabel="Hapus"
        variant="destructive"
        loading={remove.isPending}
      />
    </AppShell>
  );
}
