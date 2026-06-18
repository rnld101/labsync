import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReportPreviewModalProps {
  open: boolean;
  url: string | null;
  onClose: () => void;
}

// §3.C — floating diagnostic preview: dims the layout, renders the report in a sandboxed iframe,
// with a prominent download action at the top edge of the glass sheet.
export function ReportPreviewModal({ open, url, onClose }: ReportPreviewModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-bento bg-white shadow-bento-diffused">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold text-text-dark">Diagnostic Report Preview</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={!url} onClick={() => url && window.open(url, "_blank")}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close preview">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-surface">
          {url ? (
            <iframe title="Report preview" src={url} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              No report loaded (presigned URL is fetched on demand).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
