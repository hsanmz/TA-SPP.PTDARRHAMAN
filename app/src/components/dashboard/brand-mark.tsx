import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  logoUrl?: string;
  faviconUrl?: string;
  name?: string;
  mark?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Tile brand: gambar logo/favicon bila ada, jika tidak tile gradient emerald
 * dengan kaligrafi monogram "ار" Ar-Rahman. Ported langsung dari
 * packages/ui/src/components/dashboard/brand-mark.tsx di project-ppdb.
 */
export function BrandMark({
  logoUrl,
  faviconUrl,
  name = "Brand",
  mark,
  size = "md",
  className,
}: BrandMarkProps) {
  const iconSrc = faviconUrl || logoUrl;
  const box = size === "sm" ? "h-8 w-8 text-lg" : "h-9 w-9 text-lg";
  if (iconSrc) {
    return (
      <img
        src={iconSrc}
        alt={name}
        className={cn(
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          "shrink-0 object-contain drop-shadow-sm",
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#145337] font-bold text-white shadow-sm",
        box,
        className,
      )}
    >
      {mark ?? "ار"}
    </div>
  );
}
