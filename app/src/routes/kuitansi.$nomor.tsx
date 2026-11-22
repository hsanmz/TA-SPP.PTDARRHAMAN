import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, HandCoins, MessageCircle, Printer, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getReceipt, getSchoolProfile } from "@/lib/api/payments";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/page-loader";
import OfficialReceiptCard, { type ReceiptData } from "@/components/shared/OfficialReceiptCard";

export const Route = createFileRoute("/kuitansi/$nomor")({
  head: ({ params }) => ({
    meta: [
      { title: `Kuitansi ${params.nomor} — SPP Digital` },
      { name: "description", content: "Kuitansi pembayaran resmi yang bisa dibuka dan dibagikan." },
      { property: "og:title", content: `Kuitansi ${params.nomor} — SPP Digital` },
      { property: "og:description", content: "Kuitansi pembayaran resmi sekolah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kuitansi,
  errorComponent: () => <ErrorState status={500} />,
  notFoundComponent: () => <ErrorState status={404} />,
});

type Receipt = {
  receipt_number: string;
  amount: number;
  infaq_amount: number;
  method: string;
  created_at: Date;
  note: string | null;
  student_name?: string | null;
  student_nis?: string | null;
  invoice_title?: string | null;
};

type SchoolIdentity = {
  name: string;
  short_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tagline: string | null;
};

function Kuitansi() {
  const { nomor } = Route.useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["kuitansi", nomor],
    queryFn: async () => {
      const [receipt, profile] = await Promise.all([
        getReceipt({ data: { receiptNumber: nomor } }),
        getSchoolProfile(),
      ]);
      return {
        receipt: receipt as unknown as Receipt | null,
        profile: (profile ?? {}) as Partial<SchoolIdentity>,
      };
    },
  });

  if (isLoading) return <PageLoader />;

  const r = data?.receipt;
  const sekolah = data?.profile ?? {};

  if (!r) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ivory p-4 sm:p-6">
        <div className="w-full max-w-md">
          <EmptyState
            icon={HandCoins}
            title="Kuitansi tidak ditemukan"
            description="Nomor kuitansi tidak dikenali atau sudah tidak berlaku. Periksa kembali tautan yang Anda terima."
            action={
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/">Kembali ke halaman utama</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const total = (r.amount ?? 0) + (r.infaq_amount ?? 0);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link kuitansi berhasil disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link kuitansi");
    }
  };

  const handleWhatsApp = () => {
    if (!shareUrl || !r) return;
    const text = encodeURIComponent(
      `*KUITANSI RESMI AR-RAHMAN*\n\n` +
        `No. Kuitansi: *${r.receipt_number}*\n` +
        `Santri: ${r.student_name ?? "-"}\n` +
        `Keperluan: ${r.invoice_title ?? "-"}\n` +
        `Nominal: Rp ${total.toLocaleString("id-ID")}\n` +
        `Metode: ${r.method === "qris" ? "QRIS" : "KASIR / OFFLINE"}\n` +
        `Status: *LUNAS*\n\n` +
        `Buka kuitansi digital resmi di tautan berikut:\n${shareUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const receiptData: ReceiptData = {
    receipt_no: r.receipt_number,
    applicant_name: r.student_name || "Santri",
    registration_number: r.student_nis ? `NIS ${r.student_nis}` : undefined,
    registration_path: r.invoice_title || undefined,
    amount: total,
    payment_method: r.method,
    payment_date: r.created_at ? new Date(r.created_at).toISOString() : null,
    payment_type_label: r.invoice_title || "Kuitansi Pembayaran SPP Digital",
    status: "paid",
    is_paid: true,
  };

  return (
    <div className="min-h-dvh bg-ivory relative py-8 px-4 sm:px-6">
      {/* Background decorations ala project-ppdb */}
      <div className="pointer-events-none absolute inset-0 bg-pattern-dots opacity-[0.25]" />
      <div className="pointer-events-none absolute top-10 right-10 w-72 h-72 rounded-full bg-emerald-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 w-96 h-96 rounded-full bg-gold-accent/5 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Top Action Bar ala project-ppdb AdminReceiptPage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ to: "/pembayaran" })}
            className="gap-2 text-muted-foreground hover:text-foreground w-fit rounded-full cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="h-9 px-3.5 text-xs rounded-full gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Slip</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsApp}
              className="h-9 px-3.5 text-xs rounded-full gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer shadow-xs"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="h-9 px-3.5 text-xs rounded-full gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Tersalin" : "Salin Link"}</span>
            </Button>
          </div>
        </div>

        {/* Official Receipt Card */}
        <div className="w-full max-w-2xl mx-auto">
          <OfficialReceiptCard receipt={receiptData} />
        </div>
      </div>
    </div>
  );
}
