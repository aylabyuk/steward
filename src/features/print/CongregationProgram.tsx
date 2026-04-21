import { useParams, Navigate } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { PrintLayout } from "./PrintLayout";
import {
  formatLongDate,
  orderedSpeakers,
  personName,
  speakerSequence,
  type SequenceEntry,
} from "./programData";
import { RowFreeform, RowHymn, RowLabeled, RowSection } from "./programRows";
import type { SacramentMeeting } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function CongregationProgram() {
  const { date } = useParams<{ date: string }>();
  const authed = useAuthStore((s) => s.status === "signed_in");
  const ward = useWardSettings();
  const meeting = useMeeting(date ?? null);
  const speakers = useSpeakers(date ?? null);

  if (!date || !ISO_DATE.test(date)) return <Navigate to="/schedule" replace />;
  if (!authed) return <Navigate to="/login" replace />;

  const ready = !ward.loading && !meeting.loading && !speakers.loading;
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

  const copy = (
    <ProgramCopy
      m={m}
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

interface CopyProps {
  m: SacramentMeeting | null;
  wardName: string;
  dateLong: string;
  sequence: readonly SequenceEntry[];
  visitorText: string;
}

function ProgramCopy({ m, wardName, dateLong, sequence, visitorText }: CopyProps) {
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

      <RowSection title="Presiding & conducting" dense>
        <RowLabeled label="Presiding" value={personName(m?.presiding)} dense />
        <RowLabeled label="Conducting" value={personName(m?.conducting)} dense />
        {visitorText && <RowLabeled label="Visitors" value={visitorText} dense />}
      </RowSection>

      {m?.showAnnouncements && (m?.announcements ?? "").trim().length > 0 && (
        <RowSection title="Announcements" dense>
          <RowFreeform label="Announcements" value={m.announcements} dense />
        </RowSection>
      )}

      <RowSection title="Music" dense>
        <RowLabeled label="Pianist" value={personName(m?.pianist)} dense />
        <RowLabeled label="Chorister" value={personName(m?.chorister)} dense />
      </RowSection>

      <RowSection title="Opening" dense>
        <RowHymn
          label="Opening hymn"
          number={m?.openingHymn?.number}
          title={m?.openingHymn?.title}
          dense
        />
        <RowLabeled label="Invocation" value={personName(m?.openingPrayer)} dense />
      </RowSection>

      <RowSection title="Sacrament" dense>
        <RowHymn
          label="Sacrament hymn"
          number={m?.sacramentHymn?.number}
          title={m?.sacramentHymn?.title}
          dense
        />
      </RowSection>

      <RowSection title="Speakers & music" dense>
        {sequence.map((entry, i) =>
          entry.kind === "speaker" ? (
            <RowLabeled
              key={`s-${entry.data.id}`}
              label={`Speaker ${entry.index + 1}`}
              value={entry.data.name}
              dense
            />
          ) : (
            <RowLabeled key={`mid-${i}`} label="Interlude" value={entry.label} dense />
          ),
        )}
      </RowSection>

      <RowSection title="Closing" dense>
        <RowHymn
          label="Closing hymn"
          number={m?.closingHymn?.number}
          title={m?.closingHymn?.title}
          dense
        />
        <RowLabeled label="Benediction" value={personName(m?.benediction)} dense />
      </RowSection>
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
