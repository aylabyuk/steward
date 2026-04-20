import { createBrowserRouter, Navigate } from "react-router";
import { ScheduleView } from "@/features/schedule/ScheduleView";
import { AuthGate } from "./auth-gate";
import { Login } from "./routes/login";
import { Week } from "./routes/week";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthGate />,
    children: [
      { index: true, element: <Navigate to="/schedule" replace /> },
      { path: "schedule", element: <ScheduleView /> },
      { path: "week/:date", element: <Week /> },
    ],
  },
  { path: "/login", element: <Login /> },
]);
