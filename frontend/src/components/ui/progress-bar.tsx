import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, max = 100, className, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      {label && <p className="mb-1 text-xs text-text-muted">{label}</p>}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
