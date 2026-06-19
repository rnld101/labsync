import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "heading" | "avatar" | "block";
}

export function Skeleton({ className, variant = "block" }: SkeletonProps) {
  const base =
    "animate-shimmer bg-[length:200%_100%] rounded-md " +
    "bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100";

  const variants = {
    text:    "h-4 w-full",
    heading: "h-6 w-3/4",
    avatar:  "h-9 w-9 rounded-full",
    block:   "h-full w-full",
  };

  return <div className={cn(base, variants[variant], className)} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" className={i === lines - 1 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  );
}
