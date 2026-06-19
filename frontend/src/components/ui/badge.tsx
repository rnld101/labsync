import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { ReactNode } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium",
  {
    variants: {
      variant: {
        ready:      "bg-success-50 text-success",
        processing: "bg-warning-50 text-warning",
        failed:     "bg-danger-50 text-danger",
        pending:    "bg-slate-100 text-slate-600",
        scheduled:  "bg-primary-50 text-primary",
        default:    "bg-slate-100 text-slate-700",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

const icons: Record<string, ReactNode> = {
  ready:      <CheckCircle2 className="h-3 w-3" />,
  processing: <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: "2s" }} />,
  failed:     <XCircle className="h-3 w-3" />,
  pending:    <AlertTriangle className="h-3 w-3" />,
  scheduled:  null,
  default:    null,
};

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
}

export function Badge({ variant, size, children, className, showIcon = true }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {showIcon && variant && icons[variant]}
      {children}
    </span>
  );
}
