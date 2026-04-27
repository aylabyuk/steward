import { useParams, Navigate } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useProgramTemplate } from "@/features/program-templates/hooks/useProgramTemplate";
import { renderProgramState } from "@/features/program-templates/utils/programTemplateRender";
import { PrintLayout } from "./PrintLayout";
import { buildMeetingVariables } from "./utils/buildMeetingVariables";
import { LegacyCongregationCopy } from "./LegacyCongregationCopy";
import { formatLongDate, orderedSpeakers, speakerSequence } from "./utils/programData";

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
  const approved = m?.status === "approved";

  if (ready && !approved) return <NotApproved date={date} />;

  const speakerList = orderedSpeakers(speakers.data);
  const sequence = speakerSequence(speakerList, m?.mid);
  const visitors = (m?.visitors ?? []).filter((v) => v.name.trim().length > 0);
  const wardName = ward.data?.name ?? "Ward";
  const dateLong = formatLongDate(date);
  const visitorText = visitors
    .map((v) => (v.details ? `${v.name} (${v.details})` : v.name))
    .join(", ");

  const copy = template.data?.editorStateJson ? (
    <TemplateCopy
      wardName={wardName}
      dateLong={dateLong}
      json={template.data.editorStateJson}
      variables={buildMeetingVariables({
        date,
        meeting: m ?? null,
        speakers: speakers.data,
        ward: ward.data ?? null,
      })}
    />
  ) : (
    <LegacyCongregationCopy
      m={m ?? null}
      wardName={wardName}
      dateLong={dateLong}
      sequence={sequence}
      visitorText={visitorText}
    />
  );

  return (
    <PrintLayout ready={ready && approved} dense landscape>
      <div className="relative grid grid-cols-2 print:-mx-2">
        <div className="px-[0.35in]">{copy}</div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-walnut-3"
        />
        <div className="px-[0.35in]">{copy}</div>
      </div>
      <p className="mt-4 text-center font-serif italic text-[11px] text-walnut-3 print-hidden">
        Two copies per page — cut down the middle.
      </p>
    </PrintLayout>
  );
}

function TemplateCopy({
  wardName,
  dateLong,
  json,
  variables,
}: {
  wardName: string;
  dateLong: string;
  json: string;
  variables: Record<string, string>;
}) {
  return (
    <>
      <header className="mb-3 border-b-2 border-walnut pb-2">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brass-deep">
          Sacrament meeting · {wardName}
        </div>
        <h1 className="font-display text-[17px] font-semibold text-walnut tracking-[-0.02em] m-0 mt-0.5">
          {dateLong}
        </h1>
      </header>
      {renderProgramState(json, variables)}
    </>
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
