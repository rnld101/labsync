import { clearToken, getClaims } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ClipboardList, FileText, LogOut, Upload } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "./ui/avatar";

const NAV = [
  { to: "/staff",         icon: ClipboardList, label: "Operations"  },
  { to: "/staff/reports", icon: FileText,       label: "Reports"     },
  { to: "/staff/upload",  icon: Upload,         label: "Upload Report" },
];

export function StaffSidebar() {
  const navigate = useNavigate();
  const claims   = getClaims();
  const email    = claims?.email ?? "";

  function handleSignOut() {
    clearToken();
    navigate("/login");
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-white">L</span>
        </div>
        <div>
          <span className="text-base font-semibold tracking-tight text-text-dark">LabLumen</span>
          <span className="ml-2 rounded-full bg-warning-50 px-1.5 py-0.5 text-[10px] font-medium text-warning">
            Staff
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2" aria-label="Staff navigation">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/staff"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100",
                isActive
                  ? "bg-primary-50 text-primary"
                  : "text-text-muted hover:bg-slate-50 hover:text-text-dark",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar name={email.split("@")[0] || "Staff"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-text-dark">{email || "Staff"}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="rounded-md p-1 text-text-muted hover:bg-slate-100 hover:text-danger transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
