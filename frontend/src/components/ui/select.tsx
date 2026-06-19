import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { type SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-text-dark",
          "transition-colors duration-100",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  ),
);
Select.displayName = "Select";
