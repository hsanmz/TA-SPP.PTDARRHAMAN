import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"

export interface TrendPoint {
  date: string
  count: number
  amount?: number
}

interface RegistrationTrendProps {
  title?: string
  data?: TrendPoint[]
  loading?: boolean
  unit?: string
}

const formatLabel = (iso: string) => {
  if (iso.length === 7) return iso
  const parts = iso.split("-")
  if (parts.length >= 3) {
    return `${parts[2]}/${parts[1]}`
  }
  return iso
}

/**
 * Kartu tren grafik batang responsive.
 * Ported dari apps/ppdb/src/components/shared/RegistrationTrend.tsx.
 */
export default function RegistrationTrend({
  title = "Tren Aktivitas",
  data = [],
  loading,
  unit = "Transaksi",
}: RegistrationTrendProps) {
  const total = data.reduce((sum, point) => sum + (point.count || 0), 0)
  const chartData = data.map((point) => ({ ...point, label: formatLabel(point.date) }))

  return (
    <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <TrendingUp className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : total === 0 && chartData.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-center text-slate-400">
            <TrendingUp className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm">Belum ada data tren terbaru.</p>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.1)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value) => [value, unit]}
                />
                <Bar dataKey="count" fill="var(--color-emerald-primary, #1A6B47)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
