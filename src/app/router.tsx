import { createBrowserRouter, Navigate } from "react-router";
import { CongregationProgram } from "@/features/print/CongregationProgram";
import { ConductingProgram } from "@/features/print/ConductingProgram";
import { ScheduleView } from "@/features/schedule/ScheduleView";
import { AuthGate } from "./auth-gate";
import { AcceptInvitePage } from "./routes/accept-invite";
import { SpeakerInvitationLandingPage } from "./routes/invite-speaker";
import { Login } from "./routes/login";
import { MembersPage } from "./routes/members";
import { PrepareInvitationPage } from "./routes/prepare-invitation";
import { PrintSpeakerLetterPage } from "./routes/print-speaker-letter";
import { NotificationSettingsPage } from "./routes/notification-settings";
import { SettingsIndex } from "./routes/settings";
import { SpeakerLetterTemplatePage } from "./routes/templates-speakers";
import { SpeakerEmailTemplatePage } from "./routes/templates-speaker-email";
import { WardInviteTemplatePage } from "./routes/templates-ward-invites";
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
      { path: "settings/templates/speaker-email", element: <SpeakerEmailTemplatePage /> },
      { path: "settings/templates/ward-invites", element: <WardInviteTemplatePage /> },
    ],
  },
  // Print views + full-screen editors share AuthGate's auth + ward
  // resolution (so currentWardStore.wardId gets populated for
  // useMeeting / useSpeakers) but skip the AppShell wrapper, so the
  // page gets the full viewport — useful both for printing and for
  // the editor-with-preview pages opened in a new tab.
  {
    element: <AuthGate appShell={false} />,
    children: [
      { path: "/print/:date/congregation", element: <CongregationProgram /> },
      { path: "/print/:date/conducting", element: <ConductingProgram /> },
      { path: "/settings/templates/speakers", element: <SpeakerLetterTemplatePage /> },
      {
        path: "/week/:date/speaker/:speakerId/prepare",
        element: <PrepareInvitationPage />,
      },
      {
        path: "/week/:date/speaker/:speakerId/print-letter",
        element: <PrintSpeakerLetterPage />,
      },
    ],
  },
  // Accept-invite skips AuthGate because the invitee isn't a ward member
  // yet — AccessRequired would block them. The page handles its own
  // signed-in check.
  { path: "/accept-invite/:wardId", element: <AcceptInvitePage /> },
  // Speaker invitation landing: fully public (no auth at all). The
  // unguessable token in the URL authorizes the read per Firestore
  // rules.
  { path: "/invite/speaker/:wardId/:token", element: <SpeakerInvitationLandingPage /> },
  { path: "/login", element: <Login /> },
]);
