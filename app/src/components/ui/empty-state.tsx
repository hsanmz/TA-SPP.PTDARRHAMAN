import * as React from "react";
import { FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  className?: string;
}

/** Keadaan kosong standar (icon + judul + aksi). Ported dari packages/ui/emptystate. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-xs sm:py-12",
        className,
      )}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-primary/20 to-transparent" />

      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-light text-emerald-primary shadow-sm ring-1 ring-emerald-primary/10">
        <Icon className="h-8 w-8" />
      </div>

      <h3 className="mb-1 font-heading text-lg font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}

      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button variant="outline" size="sm" onClick={onAction} className="min-h-[36px]">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
