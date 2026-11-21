import type { ReactNode } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolbarCardProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  searchActions?: ReactNode;
  children?: ReactNode;
}

/**
 * Baris pencarian + tombol muat ulang di atas tabel. Ported dari
 * apps/ppdb components/shared/ToolbarCard.
 */
export default function ToolbarCard({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Cari nama atau username...",
  onRefresh,
  refreshing,
  searchActions,
  children,
}: ToolbarCardProps) {
  return (
    <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <form
            onSubmit={onSearchSubmit}
            className="flex flex-1 flex-wrap items-center gap-2 sm:flex-nowrap"
          >
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                className="h-10 rounded-full border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs transition-all focus:bg-white sm:text-sm"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="h-10 shrink-0 rounded-full px-4 text-xs font-semibold shadow-md shadow-emerald-primary/20 sm:px-5 sm:text-sm"
            >
              Cari
            </Button>
            {searchActions}
            {onRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full text-slate-500 hover:bg-emerald-primary/10 hover:text-primary sm:hidden"
                onClick={onRefresh}
                disabled={refreshing}
                title="Muat ulang"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            )}
          </form>
          {onRefresh && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden h-10 w-10 shrink-0 rounded-full text-slate-500 hover:bg-emerald-primary/10 hover:text-primary sm:inline-flex"
              onClick={onRefresh}
              disabled={refreshing}
              title="Muat ulang"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>
        {children && (
          <div className="no-scrollbar overflow-x-auto border-t border-slate-100 pt-3">
            {children}
          </div>
        )}
      </div>
    </Card>
  );
}
