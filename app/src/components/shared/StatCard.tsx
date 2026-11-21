import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  chip?: string
  iconText?: string
  to?: string
  actionable?: boolean
  actionableText?: string
  sub?: ReactNode
  highlight?: boolean
}

/**
 * Kartu metrik / statistik dashboard dengan bubble dekoratif & status chip.
 * Ported langsung dari apps/ppdb/src/pages/admin/AdminDashboardPage.tsx & apps/superadmin.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  chip = "bg-emerald-500",
  iconText = "text-white",
  to,
  actionable,
  actionableText = "Perlu Proses",
  sub,
  highlight,
}: StatCardProps) {
  const card = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        highlight
          ? "border-emerald-primary/30 bg-emerald-light/30"
          : "border-slate-100 bg-white",
      )}
    >
      <div
        className={cn(
          "absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.08]",
          chip,
        )}
      />
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110",
            chip,
          )}
        >
          <Icon className={cn("h-5 w-5", iconText)} />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <h3
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-3xl",
            highlight ? "text-emerald-dark" : "text-slate-900",
          )}
        >
          {value}
        </h3>
        {actionable && (
          <span className="flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> {actionableText}
          </span>
        )}
      </div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </Card>
  )

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {card}
      </Link>
    )
  }
  return card
}
