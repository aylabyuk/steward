import { createBrowserRouter, Navigate } from "react-router";
import { ScheduleView } from "@/features/schedule/ScheduleView";
import { AuthGate } from "./auth-gate";
import { Login } from "./routes/login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthGate />,
    children: [
      { index: true, element: <Navigate to="/schedule" replace /> },
      { path: "schedule", element: <ScheduleView /> },
    ],
  },
  { path: "/login", element: <Login /> },
]);
