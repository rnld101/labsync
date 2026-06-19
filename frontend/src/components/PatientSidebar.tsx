import { clearToken, getClaims } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "./ui/avatar";

const NAV = [
  { to: "/app",              icon: Home,        label: "Home"          },
  { to: "/app/book",         icon: Calendar,    label: "Book a Test"   },
  { to: "/app/appointments", icon: CalendarDays, label: "Appointments" },
  { to: "/app/reports",      icon: FileText,    label: "My Reports"    },
  { to: "/app/family",       icon: Users,       label: "Family"        },
];

export function PatientSidebar() {
  const navigate  = useNavigate();
  const claims    = getClaims();
  const email     = claims?.email ?? "";
  const initials  = email.split("@")[0] || "Me";

  function handleSignOut() {
    clearToken();
    navigate("/login");
  }

  return (
    <aside
      className={cn(
        "flex h-full w-60 flex-col border-r border-slate-100 bg-white",
        "shrink-0",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-white">L</span>
        </div>
        <span className="text-base font-semibold tracking-tight text-text-dark">LabLumen</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2" aria-label="Patient navigation">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app"}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100",
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
          <Avatar name={initials} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-text-dark">{email || "Patient"}</p>
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

// Mobile bottom tab bar
const MOBILE_TABS = [
  { to: "/app",              icon: Home,        label: "Home"     },
  { to: "/app/book",         icon: Calendar,    label: "Book"     },
  { to: "/app/reports",      icon: FileText,    label: "Reports"  },
  { to: "/app/family",       icon: Users,       label: "Family"   },
];

export function PatientBottomBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex border-t border-slate-100 bg-white pb-safe z-40 md:hidden"
      aria-label="Mobile navigation"
    >
      {MOBILE_TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/app"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors duration-100",
              isActive ? "text-primary" : "text-text-muted hover:text-text-dark",
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
