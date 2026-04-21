import type { ReactNode } from "react";
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
} from "./programData";
import { RowFreeform, RowHymn, RowLabeled, ScriptLine } from "./programRows";

function Group({ children }: { children: ReactNode }) {
  return <section className="mt-3.5 mb-1.5 flex flex-col">{children}</section>;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function ConductingProgram() {
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

  const wardName = ward.data?.name ?? "our ward";
  const dateLong = formatLongDate(date);
  const speakerList = orderedSpeakers(speakers.data);
  const sequence = speakerSequence(speakerList, m?.mid);
  const visitors = (m?.visitors ?? []).filter((v) => v.name.trim().length > 0);
  const speaker1 = speakerList[0]?.name;
  const speaker2 = speakerList[1]?.name;

  return (
    <PrintLayout ready={ready && approved} dense>
      <header className="mb-3 border-b-2 border-walnut pb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
          Conductor's copy · {wardName}
        </div>
        <h1 className="font-display text-[22px] font-semibold text-walnut tracking-[-0.02em] m-0 mt-0.5">
          {dateLong}
        </h1>
      </header>

      <ScriptLine dense>
        Welcome to sacrament meeting of the <strong className="not-italic">{wardName}</strong>.
        Today is <strong className="not-italic">{dateLong}</strong>.
      </ScriptLine>

      <Group>
        <RowLabeled label="Presiding" value={personName(m?.presiding)} dense />
        <RowLabeled label="Conducting" value={personName(m?.conducting)} dense />
        {visitors.length > 0 ? (
          visitors.map((v, i) => (
            <RowLabeled
              key={`v-${i}`}
              label={i === 0 ? "Visitors" : ""}
              value={v.details ? `${v.name} — ${v.details}` : v.name}
              dense
            />
          ))
        ) : (
          <RowLabeled label="Visitors" value="" dense />
        )}
      </Group>

      <Group>
        <RowFreeform label="Announcements" value={m?.announcements ?? ""} dense lines={3} />
      </Group>

      <Group>
        <RowLabeled label="Pianist" value={personName(m?.pianist)} dense />
        <RowLabeled label="Chorister" value={personName(m?.chorister)} dense />
      </Group>

      <Group>
        <RowHymn label="Opening hymn" number={m?.openingHymn?.number} title={m?.openingHymn?.title} dense />
        <RowLabeled label="Invocation" value={personName(m?.openingPrayer)} dense />
      </Group>

      <Group>
        <RowFreeform label="Ward business" value={m?.wardBusiness ?? ""} dense lines={2} />
        <RowFreeform label="Stake business" value={m?.stakeBusiness ?? ""} dense lines={1} />
      </Group>

      <ScriptLine dense>
        We will now turn our thoughts to the sacred ordinance of the sacrament.
      </ScriptLine>

      <Group>
        <RowHymn
          label="Sacrament hymn"
          number={m?.sacramentHymn?.number}
          title={m?.sacramentHymn?.title}
          dense
        />
      </Group>

      <ScriptLine dense>Thank the congregation for their reverence.</ScriptLine>

      <Group>
        <ScriptLine dense>
          Introduce <strong className="not-italic">{speaker1 ?? "Speaker 1"}</strong>
          {sequence.some((e) => e.kind === "mid") && <> and the musical number / rest hymn that follows.</>}
        </ScriptLine>
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
        {speaker2 && (
          <ScriptLine dense>
            Thank the pianist / chorister and earlier participants. Introduce{" "}
            <strong className="not-italic">{speaker2}</strong>, then mention the closing hymn and
            benediction.
          </ScriptLine>
        )}
      </Group>

      <Group>
        <RowHymn label="Closing hymn" number={m?.closingHymn?.number} title={m?.closingHymn?.title} dense />
        <RowLabeled label="Benediction" value={personName(m?.benediction)} dense />
      </Group>
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
