import { cn } from "@/lib/utils"

export interface SegmentedItem {
  label: string
  value: number
  color: string
}

interface SegmentedBarProps {
  items: SegmentedItem[]
  max?: number
  className?: string
}

/**
 * Bar bersegmen horizontal multi-warna dengan rincian dot label.
 * Ported langsung dari apps/superadmin/src/pages/DashboardPage.tsx.
 */
export default function SegmentedBar({ items, max, className }: SegmentedBarProps) {
  const totalIsh = max !== undefined ? max : items.reduce((s, i) => s + i.value, 0)
  if (totalIsh === 0) {
    return <p className="mt-3 text-xs text-slate-400">Belum ada data</p>
  }

  return (
    <div className={cn("mt-3", className)}>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        {items
          .filter((i) => i.value > 0)
          .map((i) => (
            <div
              key={i.label}
              style={{
                width: `${(i.value / totalIsh) * 100}%`,
                backgroundColor: i.color,
              }}
            />
          ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {items
          .filter((i) => i.value > 0)
          .map((i) => (
            <span key={i.label} className="inline-flex items-center gap-1 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: i.color }} />
              {i.label} <span className="font-semibold text-slate-700">{i.value}</span>
            </span>
          ))}
      </div>
    </div>
  )
}
