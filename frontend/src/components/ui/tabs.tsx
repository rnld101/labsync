import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex border-b border-slate-200", className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors duration-100",
            "border-b-2 -mb-px",
            tab.id === active
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-dark hover:border-slate-300",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-medium",
                tab.id === active ? "bg-primary-50 text-primary" : "bg-slate-100 text-slate-500",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  active: string;
  children: ReactNode;
}

export function TabPanel({ id, active, children }: TabPanelProps) {
  if (id !== active) return null;
  return <div role="tabpanel">{children}</div>;
}
