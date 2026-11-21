import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

const sizes: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  description?: React.ReactNode;
}

/** Modal berheader/footer tetap dengan isi yang bisa di-scroll. Ported dari packages/ui/modal. */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
  description,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
          sizes[size],
          className,
        )}
      >
        {(title || description) && (
          <DialogHeader className="shrink-0 border-b bg-secondary/30 px-6 py-4 text-left">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription className="mt-1">{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <DialogFooter className="flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-end sm:space-x-0">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
