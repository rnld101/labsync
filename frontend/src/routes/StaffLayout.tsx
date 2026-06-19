import { StaffSidebar } from "@/components/StaffSidebar";
import { Outlet } from "react-router-dom";

export function StaffLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <StaffSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
