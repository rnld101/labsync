import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { api, type OpsRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle2, ClipboardList, Clock, Search, XCircle } from "lucide-react";
import { useState, useMemo } from "react";

type StatusFilter = "all" | "scheduled" | "completed" | "cancelled";

function getRowBadge(status: string) {
  switch (status.toLowerCase()) {
    case "scheduled": return { variant: "scheduled" as const, label: "Scheduled" };
    case "completed": return { variant: "ready" as const,     label: "Completed" };
    case "cancelled": return { variant: "failed" as const,    label: "Cancelled" };
    default:          return { variant: "pending" as const,   label: status };
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}

function formatTime(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  return new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StatusChip({ status, active, count, onClick }: {
  status: StatusFilter; active: boolean; count: number; onClick: () => void;
}) {
  const labels: Record<StatusFilter, string> = {
    all: "All", scheduled: "Scheduled", completed: "Completed", cancelled: "Cancelled",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "bg-white border border-slate-200 text-text-muted hover:border-slate-300 hover:text-text-dark",
      )}
    >
      {labels[status]}
      <span className={cn("rounded-full px-1.5 text-xs font-semibold",
        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
      )}>{count}</span>
    </button>
  );
}

interface OpsRowItemProps {
  row: OpsRow;
  onStatusChange: (id: string, status: string) => void;
  isUpdating: boolean;
}

function OpsRowItem({ row, onStatusChange, isUpdating }: OpsRowItemProps) {
  const { variant, label } = getRowBadge(row.status);
  const canComplete  = row.status.toLowerCase() === "scheduled";
  const canCancel    = row.status.toLowerCase() === "scheduled";

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1 hover:shadow-elevation-2 transition-all">
      {/* Date badge */}
      <div className="hidden flex-col items-center sm:flex w-12 shrink-0">
        <span className="text-lg font-bold text-text-dark leading-none">
          {new Date(row.appointment_date + "T12:00:00").getDate()}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
          {new Date(row.appointment_date + "T12:00:00").toLocaleString("en-US", { month: "short" })}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-dark">{row.patient_name}</p>
        <p className="text-sm text-text-muted">
          {row.test_name} · {formatDate(row.appointment_date)} · {formatTime(row.time_slot)}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          ₦{Number(row.price_at_booking).toLocaleString()}
          {row.has_report && (
            <span className="ml-2 text-success">· Report uploaded</span>
          )}
        </p>
      </div>

      <Badge variant={variant} size="sm">{label}</Badge>

      {/* Actions */}
      {(canComplete || canCancel) && (
        <div className="flex shrink-0 gap-2">
          {canComplete && (
            <button
              disabled={isUpdating}
              onClick={() => onStatusChange(row.appointment_id, "completed")}
              className="flex items-center gap-1 rounded-lg border border-success/30 bg-success-50 px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success/10 disabled:opacity-50 transition-colors"
              title="Mark completed"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </button>
          )}
          {canCancel && (
            <button
              disabled={isUpdating}
              onClick={() => onStatusChange(row.appointment_id, "cancelled")}
              className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger-50 px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
              title="Cancel appointment"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Calendar; label: string; value: number; color: string;
}) {
  return (
    <div className="rounded-xl bg-white px-5 py-4 shadow-elevation-1">
      <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-text-dark">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function Operations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: rows = [], isLoading } = useQuery<OpsRow[]>({
    queryKey: ["ops"],
    queryFn: api.listOps,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateAppointmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops"] });
      toast("Status updated", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  // Today's rows
  const todayStr = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => ({
    scheduled: rows.filter((r) => r.status.toLowerCase() === "scheduled").length,
    completed: rows.filter((r) => r.status.toLowerCase() === "completed").length,
    cancelled: rows.filter((r) => r.status.toLowerCase() === "cancelled").length,
    today:     rows.filter((r) => r.appointment_date === todayStr).length,
  }), [rows, todayStr]);

  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter !== "all") result = result.filter((r) => r.status.toLowerCase() === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.patient_name.toLowerCase().includes(q) ||
          r.test_name.toLowerCase().includes(q),
      );
    }
    return [...result].sort(
      (a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    );
  }, [rows, statusFilter, search]);

  const countsByStatus = (s: StatusFilter) =>
    s === "all" ? rows.length : rows.filter((r) => r.status.toLowerCase() === s).length;

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-dark">Operations</h1>
        <p className="mt-1 text-sm text-text-muted">Manage and track all patient appointments.</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Calendar}    label="Today"     value={stats.today}     color="bg-primary-50 text-primary" />
        <StatCard icon={Clock}       label="Scheduled" value={stats.scheduled} color="bg-primary-50 text-primary" />
        <StatCard icon={CheckCircle2}label="Completed" value={stats.completed} color="bg-success-50 text-success" />
        <StatCard icon={XCircle}     label="Cancelled" value={stats.cancelled} color="bg-danger-50 text-danger" />
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search patient or test…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "scheduled", "completed", "cancelled"] as StatusFilter[]).map((s) => (
            <StatusChip
              key={s}
              status={s}
              active={statusFilter === s}
              count={countsByStatus(s)}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1">
              <div className="h-10 w-10 rounded-lg bg-slate-100 animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={<ClipboardList className="h-7 w-7" />}
            title="No appointments found"
            description={search ? "Try a different search term." : "Appointments will appear here once booked."}
          />
        )}

        {filtered.map((row) => (
          <OpsRowItem
            key={row.mapping_id}
            row={row}
            isUpdating={mutation.isPending}
            onStatusChange={(id, status) => mutation.mutate({ id, status })}
          />
        ))}
      </div>
    </div>
  );
}
