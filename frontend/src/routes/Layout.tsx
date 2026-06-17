import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-bento px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-primary text-white" : "text-text-muted hover:bg-surface",
  );

export function Layout() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-primary">LabLumen</span>
          <nav className="flex gap-2">
            <NavLink to="/" className={linkClass} end>
              Patient
            </NavLink>
            <NavLink to="/staff" className={linkClass}>
              Staff
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
