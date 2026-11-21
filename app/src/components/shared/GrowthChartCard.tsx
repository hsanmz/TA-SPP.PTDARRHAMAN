import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { LucideIcon } from "lucide-react"
import { Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface GrowthPoint {
  date: string
  total: number
}

interface GrowthChartCardProps {
  title?: string
  description?: string
  icon?: LucideIcon
  data?: GrowthPoint[]
  deltaPct?: number | null
  deltaLabel?: string
  unit?: string
  loading?: boolean
  className?: string
}

/**
 * Kartu chart area pertumbuhan kas / transaksi dengan pill perbandingan periode.
 * Ported langsung dari apps/superadmin/src/pages/DashboardPage.tsx.
 */
export default function GrowthChartCard({
  title = "Trend Penerimaan",
  description = "Aktivitas transaksi dalam periode berjalan",
  icon: Icon = Activity,
  data = [],
  deltaPct = null,
  deltaLabel = "vs periode sebelumnya",
  unit = "Rp",
  loading = false,
  className,
}: GrowthChartCardProps) {
  const hasData = data.length > 0 && data.some((p) => p.total > 0)

  return (
    <Card className={cn("flex flex-col overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Icon className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>

          {!loading && deltaPct !== null && (
            <Badge
              variant="outline"
              className={cn(
                "font-semibold",
                deltaPct > 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : deltaPct < 0
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-slate-200 bg-slate-50 text-slate-500",
              )}
            >
              {deltaPct > 0 ? "▲" : deltaPct < 0 ? "▼" : "•"}{" "}
              {deltaPct > 0 ? `+${deltaPct}` : Math.abs(deltaPct)}% {deltaLabel}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="min-h-[280px] flex-1 p-0">
        {loading ? (
          <div className="flex h-full items-center justify-center p-6">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : hasData ? (
          <div className="h-[280px] w-full p-4 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A6B47" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1A6B47" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  dx={-8}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                  formatter={(value) => [
                    typeof value === "number" ? `${unit} ${value.toLocaleString("id-ID")}` : value,
                    title,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#1A6B47"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#growthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Belum ada data grafik yang tercatat.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
