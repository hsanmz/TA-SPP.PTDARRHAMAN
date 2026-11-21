import { cn } from "@/lib/utils";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "emerald" | "gold" | "white" | "slate";
  className?: string;
}

/** Indikator memuat berbentuk cincin. Ported dari packages/ui/spinner. */
export const Spinner: React.FC<SpinnerProps> = ({ size = "md", color = "emerald", className }) => {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
    xl: "h-12 w-12 border-4",
  };

  const colors = {
    emerald: "border-emerald-primary/20 border-t-emerald-primary",
    gold: "border-gold-accent/20 border-t-gold-accent",
    white: "border-white/20 border-t-white",
    slate: "border-slate/20 border-t-slate-dark",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full",
        sizes[size],
        colors[color],
        className,
      )}
      role="status"
      aria-label="Memuat"
    />
  );
};
