import { BentoCard } from "@/components/BentoCard";

// §3.B — Staff/Admin dashboard: top counters, mid registries, lower master operations table.
export function StaffDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <BentoCard title="Today's Scheduled Volume">
        <p className="text-3xl font-semibold text-primary">12</p>
      </BentoCard>
      <BentoCard title="Pending PDF Uploads">
        <p className="text-3xl font-semibold text-warning">3</p>
      </BentoCard>
      <BentoCard title="Active Patient Registry">
        <p className="text-sm text-text-muted">Patient accounts table…</p>
      </BentoCard>
      <BentoCard title="Lab Catalog Settings">
        <p className="text-sm text-text-muted">Manage tests & pricing…</p>
      </BentoCard>
      <BentoCard title="Operations Queue" className="md:col-span-2">
        <p className="text-sm text-text-muted">
          Global queue with Check-In / Upload row controls…
        </p>
      </BentoCard>
    </div>
  );
}
