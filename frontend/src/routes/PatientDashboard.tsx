import { useState } from "react";

import { BentoCard } from "@/components/BentoCard";
import { ReportPreviewModal } from "@/components/ReportPreviewModal";
import { Button } from "@/components/ui/button";
import { useLabTests } from "@/hooks/useLabTests";

// §3.A — Patient dashboard Bento grid: hero row, mid (reports 60% / AI summary 40%), history row.
const MOCK_REPORTS = [
  { id: "r1", name: "Complete Blood Count (CBC)", date: "2026-06-10", status: "Completed" },
  { id: "r2", name: "Lipid Profile", date: "2026-05-22", status: "Completed" },
];

export function PatientDashboard() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: tests, isLoading } = useLabTests();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <BentoCard title="Upcoming Appointment" className="md:col-span-5">
        <p className="text-sm text-text-muted">
          CBC + Lipid Profile · Self · Wed 24 Jun 2026 · 09:30
        </p>
      </BentoCard>

      <div className="md:col-span-3">
        <BentoCard title="Latest Reports">
          <ul className="divide-y divide-slate-100">
            {MOCK_REPORTS.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-text-dark">{r.name}</p>
                  <p className="text-xs text-text-muted">
                    {r.date} · {r.status}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
                  Preview
                </Button>
              </li>
            ))}
          </ul>
        </BentoCard>
      </div>

      <div className="md:col-span-2">
        <BentoCard title="AI Layman Summary">
          <p className="text-sm text-text-muted">
            Your recent results look broadly normal. Cholesterol is slightly elevated — consider
            discussing diet with your clinician.
          </p>
          <Button size="sm" className="mt-3">
            Open chat
          </Button>
        </BentoCard>
      </div>

      <BentoCard title="Test Catalog" className="md:col-span-5">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading catalog…</p>
        ) : tests?.length ? (
          <div className="flex flex-wrap gap-2">
            {tests.map((t) => (
              <span
                key={t.test_id}
                className="rounded-bento bg-surface px-3 py-1 text-xs text-text-dark"
              >
                {t.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No catalog loaded — start the backend stack.</p>
        )}
      </BentoCard>

      <ReportPreviewModal open={previewOpen} url={null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
