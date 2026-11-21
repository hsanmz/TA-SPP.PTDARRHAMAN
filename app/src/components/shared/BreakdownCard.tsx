import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface BreakdownRow {
  id: string
  label: string
  sub?: string
  total: number
}

interface BreakdownCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  rows: BreakdownRow[]
  total?: number
  emptyText?: string
  className?: string
}

/**
 * Kartu rincian breakdown data terurut dengan progress bar gradasi.
 * Ported langsung dari apps/superadmin/src/pages/DashboardPage.tsx.
 */
export default function BreakdownCard({
  title,
  description,
  icon: Icon,
  rows,
  total: totalProp,
  emptyText = "Belum ada data rincian.",
  className,
}: BreakdownCardProps) {
  const sumTotal = rows.reduce((s, r) => s + r.total, 0)
  const total = totalProp !== undefined ? totalProp : sumTotal
  const sorted = [...rows].sort((a, b) => b.total - a.total)

  return (
    <Card className={cn("flex flex-col rounded-2xl border-slate-100 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        {sorted.length === 0 || total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="space-y-3.5">
            {sorted.map((r) => {
              const pct = total > 0 ? Math.round((r.total / total) * 100) : 0
              return (
                <li key={r.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-slate-700">
                      {r.label}
                      {r.sub && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400">
                          {r.sub}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm">
                      <span className="font-semibold text-slate-900">{r.total}</span>
                      <span className="ml-1 text-[11px] text-slate-400">{pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
