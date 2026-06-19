import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { api, type OpsRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Search, Upload } from "lucide-react";
import { useRef, useState } from "react";

function UploadButton({ row, onDone }: { row: OpsRow; onDone: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => api.uploadReport(row.mapping_id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops"] });
      toast("Report uploaded — AI analysis started", "success");
      onDone();
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) mutation.mutate(f);
          e.target.value = "";
        }}
      />
      <button
        disabled={mutation.isPending}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? <Spinner size="sm" /> : <Upload className="h-3.5 w-3.5" />}
        Upload
      </button>
    </>
  );
}

export function StaffReports() {
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery<OpsRow[]>({
    queryKey: ["ops"],
    queryFn: api.listOps,
  });

  const filtered = rows
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.patient_name.toLowerCase().includes(q) || r.test_name.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-dark">Reports</h1>
        <p className="mt-1 text-sm text-text-muted">Upload lab reports for completed appointments.</p>
      </div>

      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search patient or test…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2.5">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1">
              <div className="h-9 w-9 rounded-lg bg-slate-100 animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="No appointments found"
            description="Appointments for completed tests will appear here."
          />
        )}

        {filtered.map((row) => (
          <div
            key={row.mapping_id}
            className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-dark">{row.patient_name}</p>
              <p className="text-sm text-text-muted">
                {row.test_name} ·{" "}
                {new Date(row.appointment_date + "T12:00:00").toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
            {row.has_report ? (
              <Badge variant="ready" size="sm">Uploaded</Badge>
            ) : (
              <UploadButton row={row} onDone={() => {}} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
