import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = String(++counter.current);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-success shrink-0" />,
    error:   <AlertCircle  className="h-4 w-4 text-danger shrink-0" />,
    info:    <Info         className="h-4 w-4 text-info shrink-0" />,
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-bento bg-white px-4 py-3 shadow-elevation-3",
        "animate-slide-in-right border border-slate-100",
      )}
    >
      {icons[toast.variant]}
      <p className="flex-1 text-sm text-text-dark">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-text-muted hover:text-text-dark transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
