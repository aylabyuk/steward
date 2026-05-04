import { useParams, Navigate } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useProgramTemplate } from "@/features/program-templates/hooks/useProgramTemplate";
import { checkMeetingReadiness } from "@/features/meetings/utils/readiness";
import { defaultMeetingType } from "@/features/meetings/utils/ensureMeetingDoc";
import { CongregationCoverPanel } from "./CongregationCoverPanel";
import { CongregationProgramBody } from "./CongregationProgramBody";
import { NotReadyBlock } from "./NotReadyBlock";
import { PrintLayout } from "./PrintLayout";
import { formatLongDate } from "./utils/programData";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function CongregationProgram() {
  const { date } = useParams<{ date: string }>();
  const authed = useAuthStore((s) => s.status === "signed_in");
  const ward = useWardSettings();
  const meeting = useMeeting(date ?? null);
  const speakers = useSpeakers(date ?? null);
  const template = useProgramTemplate("congregationProgram");

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
  // precedence over the ward-level template.
  const override = m?.programs?.congregation;
  const templateJson = override?.editorStateJson ?? template.data?.editorStateJson ?? null;
  const wardName = ward.data?.name ?? "Ward";
  const dateLong = formatLongDate(date);

  return (
    <PrintLayout ready={ready && report.ready} dense landscape>
      <div className="relative grid grid-cols-2 print:h-screen">
        <div className="px-[0.35in] py-[0.1in]">
          <CongregationCoverPanel
            wardName={wardName}
            dateLong={dateLong}
            announcements={m?.announcements ?? ""}
            imageUrl={m?.coverImageUrl ?? null}
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-walnut-3"
        />
        <div className="px-[0.35in] py-[0.1in]">
          <CongregationProgramBody
            date={date}
            meeting={m ?? null}
            speakers={speakers.data}
            ward={ward.data ?? null}
            templateJson={templateJson}
          />
        </div>
      </div>
      <p className="mt-4 text-center font-serif italic text-[11px] text-walnut-3 print-hidden">
        Fold down the middle — cover on the left, program on the right.
      </p>
    </PrintLayout>
  );
}
