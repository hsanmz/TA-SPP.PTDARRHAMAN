import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessStateProps {
  badge?: string;
  title: string;
  titleEn?: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  actions?: ReactNode;
  fullscreen?: boolean;
  className?: string;
}

/** Layar sukses penuh. Ported dari packages/ui/success-state (router diganti TanStack). */
export function SuccessState({
  badge,
  title,
  titleEn,
  description,
  icon,
  children,
  actions,
  fullscreen = true,
  className,
}: SuccessStateProps) {
  const Icon = icon ?? CheckCircle2;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center px-4 py-12",
        fullscreen && "min-h-dvh",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-light/50 via-transparent to-gold-bg/50" />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="rounded-3xl border border-white/40 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-emerald-primary to-gold-accent opacity-20 blur-lg" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-primary to-gold-accent shadow-lg">
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>

          {badge && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-primary/30 bg-emerald-light/70 px-3 py-1 text-xs font-bold text-emerald-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {badge}
            </span>
          )}

          <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">{title}</h2>

          {titleEn && (
            <p className="mb-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {titleEn}
            </p>
          )}

          {description && (
            <p className="mb-8 text-base leading-relaxed text-muted-foreground">{description}</p>
          )}

          {children && <div className="mb-8">{children}</div>}

          {actions && (
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { Link };
