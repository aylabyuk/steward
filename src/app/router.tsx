import { createBrowserRouter, Navigate } from "react-router";
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
  { path: "/login", element: <Login /> },
]);
