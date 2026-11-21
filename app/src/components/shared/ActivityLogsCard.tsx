import { Link } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ChevronRight,
  CreditCard,
  FileText,
  GraduationCap,
  Settings,
  Shield,
  UserRound,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface AuditLogItem {
  id: string
  action: string
  entity_type: string
  user_username?: string
  created_at: string
}

const ENTITY_ICONS: [string, { icon: LucideIcon; chip: string; iconCls: string }][] = [
  ["payment", { icon: CreditCard, chip: "bg-emerald-50", iconCls: "text-emerald-600" }],
  ["pembayaran", { icon: CreditCard, chip: "bg-emerald-50", iconCls: "text-emerald-600" }],
  ["invoice", { icon: FileText, chip: "bg-amber-50", iconCls: "text-amber-600" }],
  ["tagihan", { icon: FileText, chip: "bg-amber-50", iconCls: "text-amber-600" }],
  ["student", { icon: GraduationCap, chip: "bg-blue-50", iconCls: "text-blue-600" }],
  ["siswa", { icon: GraduationCap, chip: "bg-blue-50", iconCls: "text-blue-600" }],
  ["user", { icon: UserRound, chip: "bg-indigo-50", iconCls: "text-indigo-600" }],
  ["role", { icon: Shield, chip: "bg-purple-50", iconCls: "text-purple-600" }],
]

function getEntityMeta(entity: string) {
  const key = (entity || "").toLowerCase()
  for (const [token, meta] of ENTITY_ICONS) {
    if (key.includes(token)) return meta
  }
  return { icon: Settings, chip: "bg-slate-100", iconCls: "text-slate-500" }
}

function formatDateTime(dateString: string) {
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}

interface ActivityLogsCardProps {
  logs?: AuditLogItem[]
  loading?: boolean
  manageLink?: string
  manageLabel?: string
  className?: string
}

/**
 * Kartu feed riwayat aktivitas audit log sistem.
 * Ported langsung dari apps/superadmin/src/pages/DashboardPage.tsx.
 */
export default function ActivityLogsCard({
  logs = [],
  loading = false,
  manageLink,
  manageLabel = "Kelola Aktivitas",
  className,
}: ActivityLogsCardProps) {
  return (
    <Card className={cn("flex flex-col rounded-2xl border-slate-100 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <Activity className="h-4 w-4 text-primary" />
          Aktivitas Terakhir
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {loading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const meta = getEntityMeta(log.entity_type)
              const Icon = meta.icon
              return (
                <div
                  key={log.id}
                  className="group flex items-start gap-3 p-4 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                      meta.chip,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", meta.iconCls)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {log.user_username || "Sistem"}
                      </span>{" "}
                      melakukan{" "}
                      <span className="font-medium text-primary">{log.action}</span> pada{" "}
                      <span className="font-medium">{log.entity_type}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Belum ada log aktivitas.
          </div>
        )}
      </CardContent>
      {manageLink && (
        <div className="mt-auto border-t border-slate-50 bg-slate-50/50 p-3">
          <Link
            to={manageLink}
            className="flex w-full items-center justify-center py-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {manageLabel} <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}
    </Card>
  )
}
