import { PatientBottomBar, PatientSidebar } from "@/components/PatientSidebar";
import { Outlet } from "react-router-dom";

export function PatientLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar — hidden below md */}
      <div className="hidden md:flex">
        <PatientSidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      <PatientBottomBar />
    </div>
  );
}
