import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Simple deterministic color from name
function getAvatarColor(name?: string): string {
  const colors = [
    "bg-teal-500",   "bg-blue-500",  "bg-violet-500",
    "bg-emerald-500","bg-amber-500", "bg-rose-500",
    "bg-cyan-500",   "bg-indigo-500",
  ];
  if (!name) return colors[0];
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base" };
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white select-none",
        getAvatarColor(name),
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
