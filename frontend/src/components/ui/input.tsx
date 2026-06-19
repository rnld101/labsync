import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border bg-white px-3 text-sm text-text-dark placeholder:text-slate-400",
        "transition-colors duration-100",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        error
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-slate-200 focus:border-primary focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
