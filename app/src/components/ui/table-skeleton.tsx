import * as React from "react";
import { cn } from "@/lib/utils";

/** Placeholder shimmer. Ported dari packages/ui/skeleton. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/70",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
        "before:animate-[shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * TableSkeletonRows — merender N baris skeleton di dalam table body.
 * Gunakan untuk menggantikan teks "Memuat data..." di dalam <TableBody>.
 */
function TableSkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/50">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton
                className={cn(
                  "h-4",
                  j === 0 ? "w-3/4" : j === cols - 1 ? "ml-auto w-1/3" : "w-full",
                )}
                style={{ animationDelay: `${(i * cols + j) * 60}ms` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export { Skeleton, TableSkeletonRows };
