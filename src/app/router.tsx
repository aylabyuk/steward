import { createBrowserRouter, Navigate } from "react-router";
import { ScheduleView } from "@/features/schedule/ScheduleView";
import { AuthGate } from "./auth-gate";
import { LetterTemplatesPage } from "./routes/letter-templates";
import { Login } from "./routes/login";
import { PrintCongregationPage } from "./routes/print-congregation";
import { PrintConductingPage } from "./routes/print-conducting";
import { SpeakerLetter } from "./routes/speaker-letter";
import { Week } from "./routes/week";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthGate />,
    children: [
      { index: true, element: <Navigate to="/schedule" replace /> },
      { path: "schedule", element: <ScheduleView /> },
      { path: "week/:date", element: <Week /> },
      { path: "week/:date/speaker/:id/letter", element: <SpeakerLetter /> },
      { path: "print/:date/conducting", element: <PrintConductingPage /> },
      { path: "print/:date/congregation", element: <PrintCongregationPage /> },
      { path: "settings/letter-templates", element: <LetterTemplatesPage /> },
    ],
  },
  { path: "/login", element: <Login /> },
]);
