import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Footer paginasi tabel. Ported dari apps/ppdb components/shared/PaginationControls. */
export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-2.5 border-t px-3 py-3 sm:flex-row sm:px-4">
      <span className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
        Halaman <span className="font-semibold text-foreground">{page}</span> dari{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </span>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex-1 px-3 text-xs sm:flex-none sm:text-sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4 shrink-0" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex-1 px-3 text-xs sm:flex-none sm:text-sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
