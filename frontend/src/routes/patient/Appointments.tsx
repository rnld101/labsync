import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Appointment } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function formatTime(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  return new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getApptBadge(status: string) {
  switch (status.toLowerCase()) {
    case "completed": return { variant: "ready" as const,      label: "Completed" };
    case "scheduled": return { variant: "scheduled" as const,  label: "Scheduled" };
    case "cancelled": return { variant: "failed" as const,     label: "Cancelled" };
    default:          return { variant: "pending" as const,    label: status };
  }
}

export function Appointments() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: api.listMyAppointments,
  });

  const sorted = appointments
    ? [...appointments].sort(
        (a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
      )
    : [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Appointments</h1>
          <p className="mt-1 text-sm text-text-muted">Your upcoming and past lab visits.</p>
        </div>
        <Link
          to="/app/book"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          + Book
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1">
              <div className="h-10 w-10 rounded-lg bg-slate-100 animate-shimmer bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}

        {!isLoading && sorted.length === 0 && (
          <EmptyState
            icon={<Calendar className="h-7 w-7" />}
            title="No appointments"
            description="Book a lab test to get started."
            action={
              <Link
                to="/app/book"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                Book a Test
              </Link>
            }
          />
        )}

        {sorted.map((appt) => {
          const { variant, label } = getApptBadge(appt.status);
          return (
            <div
              key={appt.appointment_id}
              className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-elevation-1"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-dark">
                  {new Date(appt.appointment_date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
                <p className="flex items-center gap-1 text-sm text-text-muted">
                  <Clock className="h-3 w-3" />
                  {formatTime(appt.time_slot)}
                </p>
              </div>
              <Badge variant={variant} size="sm">{label}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
