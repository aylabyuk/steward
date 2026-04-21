import { createBrowserRouter, Navigate } from "react-router";
import { CongregationProgram } from "@/features/print/CongregationProgram";
import { ConductingProgram } from "@/features/print/ConductingProgram";
import { ScheduleView } from "@/features/schedule/ScheduleView";
import { AuthGate } from "./auth-gate";
import { Login } from "./routes/login";
import { MembersPage } from "./routes/members";
import { NotificationSettingsPage } from "./routes/notification-settings";
import { SettingsIndex } from "./routes/settings";
import { WardSettingsPage } from "./routes/ward-settings";
import { Week } from "./routes/week";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthGate />,
    children: [
      { index: true, element: <Navigate to="/schedule" replace /> },
      { path: "schedule", element: <ScheduleView /> },
      { path: "week/:date", element: <Week /> },
      { path: "settings", element: <SettingsIndex /> },
      { path: "settings/ward", element: <WardSettingsPage /> },
      { path: "settings/members", element: <MembersPage /> },
      { path: "settings/notifications", element: <NotificationSettingsPage /> },
    ],
  },
  // Print views render standalone — no AppShell / topbar — so the printed
  // page doesn't include app chrome. They still gate on auth + approval
  // internally.
  { path: "/print/:date/congregation", element: <CongregationProgram /> },
  { path: "/print/:date/conducting", element: <ConductingProgram /> },
  { path: "/login", element: <Login /> },
]);
