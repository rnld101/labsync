import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { AuthProvider } from "@/lib/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { ForgotPassword } from "@/routes/ForgotPassword";
import { Landing } from "@/routes/Landing";
import { Login } from "@/routes/Login";
import { PatientLayout } from "@/routes/PatientLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { StaffLayout } from "@/routes/StaffLayout";
import { Appointments } from "@/routes/patient/Appointments";
import { BookingWizard } from "@/routes/patient/BookingWizard";
import { Family } from "@/routes/patient/Family";
import { PatientHome } from "@/routes/patient/Home";
import { ReportWorkspace } from "@/routes/patient/ReportWorkspace";
import { Reports } from "@/routes/patient/Reports";
import { Operations } from "@/routes/staff/Operations";
import { StaffReports } from "@/routes/staff/StaffReports";
import { ToastProvider } from "@/components/ui/toast";

const router = createBrowserRouter([
  // Public
  { path: "/",                element: <Landing /> },
  { path: "/login",           element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },

  // Patient routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ProtectedRoute patientOnly />,
        children: [
          {
            path: "/app",
            element: <PatientLayout />,
            children: [
              { index: true,                  element: <PatientHome /> },
              { path: "book",                 element: <BookingWizard /> },
              { path: "appointments",         element: <Appointments /> },
              { path: "reports",              element: <Reports /> },
              { path: "reports/:id",          element: <ReportWorkspace /> },
              { path: "family",               element: <Family /> },
            ],
          },
        ],
      },
      // Staff routes
      {
        element: <ProtectedRoute staffOnly />,
        children: [
          {
            path: "/staff",
            element: <StaffLayout />,
            children: [
              { index: true,          element: <Operations /> },
              { path: "reports",      element: <StaffReports /> },
              { path: "upload",       element: <Navigate to="/staff/reports" replace /> },
            ],
          },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
