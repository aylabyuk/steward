import { useParams, Navigate } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useProgramTemplate } from "@/features/program-templates/useProgramTemplate";
import { renderProgramState } from "@/features/program-templates/programTemplateRender";
import { PrintLayout } from "./PrintLayout";
import { buildMeetingVariables } from "./buildMeetingVariables";
import { LegacyConductingCopy } from "./LegacyConductingCopy";
import { formatLongDate, orderedSpeakers, speakerSequence } from "./programData";

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
  const approved = m?.status === "approved";

  if (ready && !approved) return <NotApproved date={date} />;

  const wardName = ward.data?.name ?? "our ward";
  const dateLong = formatLongDate(date);

  const header = (
    <header className="mb-3 border-b-2 border-walnut pb-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
        Conductor's copy · {wardName}
      </div>
      <h1 className="font-display text-[22px] font-semibold text-walnut tracking-[-0.02em] m-0 mt-0.5">
        {dateLong}
      </h1>
    </header>
  );

  // Template-driven rendering closes the loop between the WYSIWYG
  // editor and the printed output. Falls back to the hardcoded
  // layout for wards that haven't customized yet.
  if (template.data?.editorStateJson) {
    const variables = buildMeetingVariables({
      date,
      meeting: m ?? null,
      speakers: speakers.data,
      ward: ward.data ?? null,
    });
    return (
      <PrintLayout ready={ready && approved} dense>
        {header}
        {renderProgramState(template.data.editorStateJson, variables)}
      </PrintLayout>
    );
  }

  const speakerList = orderedSpeakers(speakers.data);
  const sequence = speakerSequence(speakerList, m?.mid);
  const visitors = (m?.visitors ?? []).filter((v) => v.name.trim().length > 0);

  return (
    <PrintLayout ready={ready && approved} dense>
      {header}
      <LegacyConductingCopy
        m={m ?? null}
        wardName={wardName}
        dateLong={dateLong}
        speakerList={speakerList}
        sequence={sequence}
        visitors={visitors}
      />
    </PrintLayout>
  );
}

function NotApproved({ date }: { date: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-parchment p-8 text-center">
      <div className="max-w-md">
        <p className="font-display text-[20px] text-walnut mb-2">Not yet approved</p>
        <p className="font-serif italic text-[13.5px] text-walnut-2">
          The program for <strong>{formatLongDate(date)}</strong> needs two bishopric approvals
          before it can be printed.
        </p>
      </div>
    </div>
  );
}
