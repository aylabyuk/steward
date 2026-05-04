import { useParams, Navigate } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useProgramTemplate } from "@/features/program-templates/hooks/useProgramTemplate";
import { checkMeetingReadiness } from "@/features/meetings/utils/readiness";
import { defaultMeetingType } from "@/features/meetings/utils/ensureMeetingDoc";
import { ConductingProgramBody } from "./ConductingProgramBody";
import { NotReadyBlock } from "./NotReadyBlock";
import { PrintLayout } from "./PrintLayout";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function ConductingProgram() {
  const { date } = useParams<{ date: string }>();
  const authed = useAuthStore((s) => s.status === "signed_in");
  const ward = useWardSettings();
  const meeting = useMeeting(date ?? null);
  const speakers = useSpeakers(date ?? null);
  const template = useProgramTemplate("conductingProgram");

  if (!date || !ISO_DATE.test(date)) return <Navigate to="/schedule" replace />;
  if (!authed) return <Navigate to="/login" replace />;

  const ready = !ward.loading && !meeting.loading && !speakers.loading && !template.loading;
  const m = meeting.data;
  const nonMeeting = ward.data?.settings.nonMeetingSundays ?? [];
  const meetingType = m?.meetingType ?? defaultMeetingType(date, nonMeeting);
  const report = checkMeetingReadiness(m, speakers.data, meetingType);

  if (ready && !report.ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-parchment p-8">
        <NotReadyBlock date={date} report={report} />
      </div>
    );
  }

  // Per-Sunday override (saved from /week/:date/prepare) takes
  // precedence over the ward-level template — the bishopric tailored
  // this Sunday's program for this meeting.
  const override = m?.programs?.conducting;
  const templateJson = override?.editorStateJson ?? template.data?.editorStateJson ?? null;

  return (
    <PrintLayout ready={ready && report.ready} dense>
      <ConductingProgramBody
        date={date}
        meeting={m ?? null}
        speakers={speakers.data}
        ward={ward.data ?? null}
        templateJson={templateJson}
      />
    </PrintLayout>
  );
}
