import * as React from 'react'
import {
  BookOpen,
  Clock,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Badge,
  X,
} from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './sheet'
import { Button } from './button'
import { Badge as UiBadge } from './badge'
import { cn } from '@/lib/utils'

export interface DocSection {
  number: number
  title: string
  icon?: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

export interface DocItem {
  title: string
  subtitle: string
  sections: DocSection[]
  contactNote?: string
}

export const SYSTEM_DOCS: Record<string, DocItem> = {
  'spp-beranda': {
    title: 'Dashboard Keuangan & SPP',
    subtitle: 'Petunjuk operasional pemantauan tagihan, kas masuk, dan pengeluaran.',
    sections: [
      {
        number: 1,
        title: 'Ringkasan Kas & Tagihan',
        icon: Sparkles,
        content: (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            Halaman <strong>Beranda</strong> menyajikan rekapitulasi siswa aktif, total tagihan yang belum dibayar,
            penerimaan semester ini, pengeluaran kas, serta transaksi yang memerlukan konfirmasi/verifikasi admin.
          </p>
        ),
      },
      {
        number: 2,
        title: 'Generator Tagihan SPP Bulanan',
        icon: Clock,
        content: (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            Admin dapat menekan tombol <strong>Buat Tagihan SPP</strong> pada awal setiap bulan. Sistem secara otomatis
            akan mengenerate invoice tagihan SPP untuk seluruh siswa aktif sesuai tarif tingkatan masing-masing.
          </p>
        ),
      },
      {
        number: 3,
        title: 'Verifikasi Pembayaran & QRIS',
        icon: ShieldAlert,
        content: (
          <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 text-amber-950">
            Pembayaran transfer manual atau unggah bukti transfer memerlukan persetujuan di menu Pembayaran.
            Pembayaran instan QRIS diverifikasi langsung oleh sistem secara real-time.
          </p>
        ),
      },
    ],
  },
}

export interface DocButtonProps {
  onClick?: () => void
  title?: string
  className?: string
  variant?: 'light' | 'dark'
}

export function DocButton({
  onClick,
  title = 'Panduan & Cara Kerja',
  className,
  variant = 'light',
}: DocButtonProps) {
  const isDark = variant === 'dark'
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        'h-10 w-10 rounded-xl transition-colors',
        isDark
          ? 'text-emerald-100 hover:text-white hover:bg-white/15'
          : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50',
        className
      )}
      title={title}
    >
      <BookOpen className="h-5 w-5" />
    </Button>
  )
}

export interface DocSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc?: DocItem
  docKey?: string
}

export function DocSheet({ open, onOpenChange, doc, docKey }: DocSheetProps) {
  const activeDoc = doc || (docKey ? SYSTEM_DOCS[docKey] : undefined)
  if (!activeDoc) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-[100vw] sm:max-w-xl md:max-w-2xl overflow-y-auto p-4 sm:p-6 space-y-6">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-slate-900">
                Panduan & Cara Kerja {activeDoc.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {activeDoc.subtitle}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {activeDoc.sections.map((sec) => {
          const SectionIcon = sec.icon || Sparkles
          return (
            <div key={sec.number} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SectionIcon className="h-4 w-4 text-emerald-600" />
                {sec.number}. {sec.title}
              </h3>
              {sec.content}
            </div>
          )
        })}

        {/* Footer Bantuan */}
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-900">
              {activeDoc.contactNote ||
                'Ada pertanyaan atau kendala operasional? Hubungi Bagian Administrasi Keuangan Pesantren Ar-Rahman.'}
            </p>
          </div>
          <div className="flex justify-end sm:justify-center">
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                className="group w-full gap-2 rounded-xl border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:scale-[1.01] sm:w-auto"
              >
                <X className="h-4 w-4 transition-transform group-hover:scale-110" />
                Tutup Panduan
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export interface DocTriggerProps {
  docKey?: string
  doc?: DocItem
  title?: string
  className?: string
  variant?: 'light' | 'dark'
}

export function DocTrigger({
  docKey,
  doc,
  title,
  className,
  variant = 'light',
}: DocTriggerProps) {
  const [open, setOpen] = React.useState(false)
  const activeDoc = doc || (docKey ? SYSTEM_DOCS[docKey] : undefined)

  if (!activeDoc) return null

  const resolvedTitle = title || `Panduan & Cara Kerja ${activeDoc.title}`

  return (
    <>
      <DocButton
        onClick={() => setOpen(true)}
        title={resolvedTitle}
        className={className}
        variant={variant}
      />
      <DocSheet open={open} onOpenChange={setOpen} doc={activeDoc} />
    </>
  )
}
