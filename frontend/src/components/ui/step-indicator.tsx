import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number;
  className?: string;
}

export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const done    = step.id < current;
        const active  = step.id === current;
        const pending = step.id > current;

        return (
          <div key={step.id} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                  done    && "bg-primary text-white",
                  active  && "bg-primary text-white ring-4 ring-primary/20",
                  pending && "border-2 border-slate-200 text-slate-400 bg-white",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "mt-1 hidden text-xs font-medium sm:block",
                  active  ? "text-primary" : "text-text-muted",
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="mx-2 h-0.5 flex-1 min-w-[24px] transition-colors duration-300">
                <div className={cn("h-full rounded-full", done ? "bg-primary" : "bg-slate-200")} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
