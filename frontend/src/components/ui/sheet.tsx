import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  side?: "right" | "left" | "bottom";
}

export function Sheet({ open, onClose, title, children, className, side = "right" }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const sideClasses = {
    right:  "right-0 top-0 h-full w-full max-w-md animate-slide-in-right",
    left:   "left-0 top-0 h-full w-full max-w-md",
    bottom: "bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl animate-slide-in-up",
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={cn(
          "absolute bg-white shadow-elevation-3 flex flex-col",
          sideClasses[side],
          className,
        )}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-text-dark">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-text-muted hover:bg-slate-100 hover:text-text-dark transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
