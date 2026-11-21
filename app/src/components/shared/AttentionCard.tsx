import { Link } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface AttentionItem {
  label: string
  value: number
  icon: LucideIcon
  tone: "amber" | "red" | "blue" | "emerald"
  href: string
}

const TONE = {
  amber: { chip: "bg-amber-50", text: "text-amber-600", badge: "bg-amber-500" },
  red: { chip: "bg-red-50", text: "text-red-600", badge: "bg-red-500" },
  blue: { chip: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-500" },
  emerald: { chip: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-500" },
} as const

interface AttentionCardProps {
  title?: string
  description?: string
  items: AttentionItem[]
  loading?: boolean
  className?: string
}

/**
 * Kartu widget "Perlu Perhatian" untuk item yang membutuhkan tindak lanjut admin.
 * Ported langsung dari apps/ppdb/src/pages/admin/AdminDashboardPage.tsx.
 */
export default function AttentionCard({
  title = "Perlu Perhatian",
  description = "Item yang membutuhkan tindakan admin",
  items,
  loading = false,
  className,
}: AttentionCardProps) {
  const hasAttention = items.some((item) => item.value > 0)

  return (
    <Card className={cn("flex h-full flex-col rounded-2xl border-slate-100 bg-white shadow-sm", className)}>
      <div className="border-b border-slate-50 px-5 py-4">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
          <AlertTriangle
            className={cn("h-5 w-5", hasAttention ? "text-amber-500" : "text-slate-300")}
          />
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">{description}</p>
      </div>
      <div className="flex-1 p-2">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-center text-xs text-muted-foreground">
            Semua item telah terselesaikan.
          </div>
        ) : (
          items.map((item) => {
            const tone = TONE[item.tone]
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                to={item.href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                    tone.chip,
                  )}
                >
                  <Icon className={cn("h-4 w-4", tone.text)} />
                </div>
                <span className="flex-1 text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-bold text-white",
                    item.value > 0 ? tone.badge : "bg-slate-200 text-slate-600",
                  )}
                >
                  {item.value}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-primary" />
              </Link>
            )
          })
        )}
      </div>
    </Card>
  )
}
