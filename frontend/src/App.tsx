import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/routes/Layout";
import { PatientDashboard } from "@/routes/PatientDashboard";
import { StaffDashboard } from "@/routes/StaffDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <PatientDashboard /> },
      { path: "staff", element: <StaffDashboard /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
