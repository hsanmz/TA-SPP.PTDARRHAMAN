import { toast as sonnerToast } from "sonner";
import { createContext, useContext, type ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: (type: ToastType, message: string) => {
    if (type === "success") sonnerToast.success(message);
    else if (type === "error") sonnerToast.error(message);
    else if (type === "warning") sonnerToast.warning(message);
    else sonnerToast.info(message);
  },
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = (type: ToastType, message: string) => {
    if (type === "success") sonnerToast.success(message);
    else if (type === "error") sonnerToast.error(message);
    else if (type === "warning") sonnerToast.warning(message);
    else sonnerToast.info(message);
  };
  return <ToastContext.Provider value={{ toast }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}

export default useToast;
