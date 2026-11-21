import { CheckCircle, QrCode, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReceiptQrCode from "./ReceiptQrCode";

const formatRp = (n: number) => "Rp " + (n || 0).toLocaleString("id-ID");

export interface ReceiptData {
  id?: string;
  receipt_no: string;
  order_id?: string;
  txn_id?: string;
  payment_type?: string;
  payment_type_label?: string;
  installment_number?: number | null;
  applicant_name: string;
  registration_number?: string;
  registration_path?: string;
  wave_name?: string;
  amount: number;
  payment_method: string;
  payment_date?: string | null;
  status: string;
  is_paid: boolean;
  financial_snapshot?: {
    total_obligation?: number | null;
    total_paid_before?: number | null;
    remaining_before?: number | null;
    amount_paid?: number | null;
    total_paid_after?: number | null;
    remaining_after?: number | null;
    is_lunas?: boolean;
  };
}

interface OfficialReceiptCardProps {
  receipt: ReceiptData;
  showWatermark?: boolean;
}

/**
 * Kartu kuitansi resmi bertaraf institusi.
 * Ported langsung dari apps/ppdb components/shared/OfficialReceiptCard.
 */
export default function OfficialReceiptCard({
  receipt,
  showWatermark = true,
}: OfficialReceiptCardProps) {
  const amountStr = formatRp(receipt.amount);
  const verifyUrl = receipt.receipt_no
    ? typeof window !== "undefined"
      ? `${window.location.origin}/kuitansi/${receipt.receipt_no}`
      : `/kuitansi/${receipt.receipt_no}`
    : null;

  const payDateStr = receipt.payment_date
    ? new Date(receipt.payment_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "-";

  const docTitle =
    receipt.payment_type_label ||
    (receipt.payment_type === "spp"
      ? "Kuitansi Pembayaran SPP Bulanan"
      : receipt.payment_type === "event"
        ? "Kuitansi Pembayaran Kegiatan / Event"
        : "Kuitansi Pembayaran Tagihan Sekolah");

  const isLunas =
    receipt.financial_snapshot?.is_lunas ??
    (receipt.financial_snapshot?.remaining_after === 0 || receipt.is_paid);

  return (
    <Card className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border-emerald-200/80 bg-white shadow-xl">
      {/* Background Watermark */}
      {showWatermark && (
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-[0.03]">
          <ShieldCheck className="h-80 w-80 text-emerald-950 sm:h-96 sm:w-96" />
        </div>
      )}

      {/* Header Kuitansi */}
      <div className="relative z-10 flex flex-col justify-between gap-4 border-b border-emerald-800/60 bg-emerald-950 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-4 text-white sm:flex-row sm:items-center sm:gap-5 sm:p-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 leading-snug sm:text-xs">
              Pesantren Tahfidz Qur&apos;an dan Digital Ar-Rahman
            </span>
          </div>
          <h2 className="mt-1 break-words font-heading text-lg font-bold text-white sm:text-2xl">
            {docTitle}
          </h2>
          <p className="mt-0.5 max-w-full truncate font-mono text-xs text-emerald-100/90">
            No: {receipt.receipt_no}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-emerald-700/50 pt-2 sm:flex-col sm:items-end sm:justify-start sm:border-t-0 sm:pt-0">
          <Badge
            className={`${
              isLunas
                ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-400"
                : "bg-amber-300 text-amber-950 hover:bg-amber-300"
            } gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm`}
          >
            <CheckCircle className="h-3.5 w-3.5" /> {isLunas ? "LUNAS" : "TERVERIFIKASI"}
          </Badge>
          <span className="font-mono text-[11px] font-medium text-emerald-200">
            SPP Digital {new Date().getFullYear()}
          </span>
        </div>
      </div>

      <CardContent className="relative z-10 space-y-5 p-4 sm:space-y-6 sm:p-7">
        {/* Detail Siswa & Transaksi */}
        <div className="grid grid-cols-1 gap-3.5 rounded-2xl border border-slate-150 bg-slate-50/80 p-4 text-sm sm:grid-cols-2 sm:gap-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Nama Siswa / Santri</p>
            <p className="mt-0.5 break-words font-bold text-base text-slate-900">
              {receipt.applicant_name}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">NIS / Kelas</p>
            <p className="mt-0.5 font-semibold text-emerald-700">
              {receipt.registration_number ? `${receipt.registration_number}` : "—"}
              {receipt.registration_path ? ` · ${receipt.registration_path}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Metode Pembayaran</p>
            <p className="mt-0.5 font-semibold uppercase text-slate-800">
              {receipt.payment_method === "qris" ? "QRIS Instan" : "Offline / Transfer"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Waktu Pembayaran</p>
            <p className="mt-0.5 font-semibold text-slate-800">{payDateStr}</p>
          </div>
        </div>

        {/* Nominal Terbayar */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-4 text-center sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Jumlah Pembayaran Diterima
          </p>
          <p className="mt-1 font-mono text-3xl font-extrabold tracking-tight text-emerald-800 sm:text-4xl">
            {amountStr}
          </p>
          <p className="mt-2 text-xs italic text-emerald-700/80">
            Status: Terkonfirmasi dan tercatat di pembukuan resmi sekolah.
          </p>
        </div>

        {/* QR Code Verifikasi Kuitansi */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-4 sm:flex-row sm:p-5">
          <div className="flex w-full min-w-0 flex-col items-center gap-3.5 sm:flex-row">
            {verifyUrl ? (
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                title="Pindai atau klik untuk verifikasi kuitansi publik"
              >
                <ReceiptQrCode value={verifyUrl} />
              </a>
            ) : (
              <div className="shrink-0 rounded-2xl bg-slate-900 p-2.5 text-white shadow-sm sm:p-3">
                <QrCode className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Verifikasi Resmi
                </span>
                <span className="max-w-full truncate font-mono text-xs font-semibold text-slate-600">
                  {receipt.receipt_no}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Pindai QR ini atau buka tautan verifikasi untuk memastikan keaslian kuitansi di
                sistem resmi.
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 justify-center text-center sm:w-auto sm:justify-end sm:text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>Status Sah</span>
            </div>
          </div>
        </div>

        {/* Footer Catatan Kuitansi */}
        <div className="flex flex-col items-center justify-between gap-1.5 border-t border-slate-100 pt-2 text-center text-[11px] text-slate-400 sm:flex-row sm:gap-2 sm:text-left">
          <p>© {new Date().getFullYear()} Pesantren Tahfidz Qur&apos;an dan Digital Ar-Rahman.</p>
          <p className="font-mono text-[10px] sm:text-[11px]">
            Dokumen Digital Sah Tanpa Tanda Tangan Basah
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
