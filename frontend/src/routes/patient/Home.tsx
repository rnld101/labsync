import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Report } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getClaims } from "@/lib/auth";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function PatientHome() {
  const claims = getClaims();
  const email  = claims?.email ?? "";
  const name   = email.split("@")[0] || "there";

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: api.listReports,
    refetchInterval: (q) =>
      q.state.data?.some((r) => !r.has_summary && !r.processing_failed) ? 4000 : false,
  });

  const latestReports = reports
    ? [...reports]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
    : [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Greeting */}
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          {greeting()},
        </p>
        <h1 className="mt-1 text-3xl font-bold text-text-dark capitalize">{name}</h1>
      </div>

      {/* Quick actions */}
      <div className="mb-10 grid grid-cols-2 gap-3">
        <Link
          to="/app/book"
          className="flex items-center gap-3 rounded-xl bg-primary p-5 text-white hover:bg-primary-700 transition-colors"
        >
          <Calendar className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">Book a Test</p>
            <p className="text-xs text-white/70">Schedule lab work</p>
          </div>
        </Link>
        <Link
          to="/app/reports"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-text-dark hover:shadow-elevation-1 transition-all"
        >
          <FileText className="h-6 w-6 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">My Reports</p>
            <p className="text-xs text-text-muted">View all results</p>
          </div>
        </Link>
      </div>

      {/* Recent reports */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-dark">Recent Reports</h2>
          <Link to="/app/reports" className="flex items-center gap-1 text-xs text-primary hover:underline">
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {isLoading &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-elevation-1">
                <div className="h-9 w-9 rounded-lg bg-slate-100 animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}

          {!isLoading && latestReports.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-text-muted">No reports yet</p>
            </div>
          )}

          {latestReports.map((r) => (
            <Link
              key={r.report_id}
              to={`/app/reports/${r.report_id}`}
              className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-elevation-1 hover:shadow-elevation-2 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                {r.has_summary ? <Sparkles className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-dark">{r.test_name}</p>
                <p className="text-xs text-text-muted">{r.patient_name}</p>
              </div>
              <Badge
                variant={r.processing_failed ? "failed" : r.has_summary ? "ready" : "processing"}
                size="sm"
                showIcon={false}
              >
                {r.processing_failed ? "Failed" : r.has_summary ? "Ready" : "Processing"}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
