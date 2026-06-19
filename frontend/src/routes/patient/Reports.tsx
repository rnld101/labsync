import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Report } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function getReportBadge(r: Report) {
  if (r.processing_failed) return { variant: "failed" as const, label: "Analysis Failed" };
  if (r.has_summary)        return { variant: "ready" as const,  label: "AI Ready" };
  return                         { variant: "processing" as const, label: "Analyzing…" };
}

function ReportRow({ report }: { report: Report }) {
  const { variant, label } = getReportBadge(report);
  const date = new Date(report.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <Link
      to={`/app/reports/${report.report_id}`}
      className="group flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-150"
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
        {report.has_summary
          ? <Sparkles className="h-5 w-5" />
          : <FileText className="h-5 w-5" />
        }
      </div>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-dark truncate">{report.test_name}</p>
        <p className="text-sm text-text-muted">{report.patient_name} · {date}</p>
      </div>

      {/* Status */}
      <Badge variant={variant} size="sm">{label}</Badge>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-primary transition-colors" />
    </Link>
  );
}

function ReportRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1">
      <div className="h-10 w-10 rounded-lg bg-slate-100 animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function Reports() {
  const { data, isLoading } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: api.listReports,
    refetchInterval: (query) =>
      query.state.data?.some((r) => !r.has_summary && !r.processing_failed) ? 4000 : false,
  });

  const sorted = data ? [...data].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) : [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-dark">My Reports</h1>
        <p className="mt-1 text-sm text-text-muted">
          AI-analyzed lab results — click any report to explore your findings.
        </p>
      </div>

      <div className="space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <ReportRowSkeleton key={i} />)}

        {!isLoading && sorted.length === 0 && (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="No reports yet"
            description="Your lab reports will appear here once they've been uploaded by the clinic."
          />
        )}

        {sorted.map((r) => <ReportRow key={r.report_id} report={r} />)}
      </div>
    </div>
  );
}
