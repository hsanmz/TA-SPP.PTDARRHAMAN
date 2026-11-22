import type { LucideIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DonutItem {
  label: string;
  value: number;
  color: string;
}

interface DonutCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  items: DonutItem[];
  emptyText?: string;
  className?: string;
}

/**
 * Kartu ringkasan distribusi komposisi dengan Donut Chart Recharts.
 * Ported langsung dari apps/superadmin/src/pages/DashboardPage.tsx.
 */
export default function DonutCard({
  title,
  description,
  icon: Icon,
  items,
  emptyText = "Belum ada data",
  className,
}: DonutCardProps) {
  const visible = items.filter((i) => i.value > 0);
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <Card
      className={cn("flex flex-col rounded-2xl border-slate-100 bg-white shadow-sm", className)}
    >
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="flex-1 pt-5">
        {visible.length > 0 ? (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visible}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={44}
                    outerRadius={64}
                    paddingAngle={2}
                    strokeWidth={2}
                  >
                    {visible.map((i) => (
                      <Cell key={i.label} fill={i.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{total}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">total</span>
              </div>
            </div>
            <ul className="w-full flex-1 space-y-2">
              {visible.map((i) => (
                <li key={i.label} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: i.color }}
                    />
                    {i.label}
                  </span>
                  <span className="font-semibold text-slate-800">{i.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}
