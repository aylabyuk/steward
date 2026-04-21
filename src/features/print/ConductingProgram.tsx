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
import { RowFreeform, RowHymn, RowLabeled, RowSection, ScriptLine } from "./programRows";

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

  if (ready && !approved) return <Navigate to="/schedule" replace />;

  const wardName = ward.data?.name ?? "our ward";
  const dateLong = formatLongDate(date);
  const speakerList = orderedSpeakers(speakers.data);
  const sequence = speakerSequence(speakerList, m?.mid);
  const visitors = (m?.visitors ?? []).filter((v) => v.name.trim().length > 0);
  const speaker1 = speakerList[0]?.name;
  const speaker2 = speakerList[1]?.name;

  return (
    <PrintLayout ready={ready && approved}>
      <header className="mb-5 border-b-2 border-walnut pb-3">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep">
          Conductor's copy · {wardName}
        </div>
        <h1 className="font-display text-[28px] font-semibold text-walnut tracking-[-0.02em] m-0 mt-1">
          {dateLong}
        </h1>
      </header>

      <ScriptLine>
        Welcome to sacrament meeting of the <strong className="not-italic">{wardName}</strong>.
        Today is <strong className="not-italic">{dateLong}</strong>.
      </ScriptLine>

      <RowSection title="On the stand">
        <RowLabeled label="Presiding" value={personName(m?.presiding)} />
        <RowLabeled label="Conducting" value={personName(m?.conducting)} />
        {visitors.length > 0 ? (
          visitors.map((v, i) => (
            <RowLabeled
              key={`v-${i}`}
              label={i === 0 ? "Visitors" : ""}
              value={v.details ? `${v.name} — ${v.details}` : v.name}
            />
          ))
        ) : (
          <RowLabeled label="Visitors" value="" />
        )}
      </RowSection>

      <RowSection title="Announcements">
        <RowFreeform label="Announcements" value={m?.announcements ?? ""} />
      </RowSection>

      <RowSection title="Music">
        <RowLabeled label="Pianist" value={personName(m?.pianist)} />
        <RowLabeled label="Chorister" value={personName(m?.chorister)} />
      </RowSection>

      <RowSection title="Opening">
        <RowHymn label="Opening hymn" number={m?.openingHymn?.number} title={m?.openingHymn?.title} />
        <RowLabeled label="Invocation" value={personName(m?.openingPrayer)} />
      </RowSection>

      <RowSection title="Ward & stake business">
        <RowFreeform label="Ward business" value={m?.wardBusiness ?? ""} />
        <RowFreeform label="Stake business" value={m?.stakeBusiness ?? ""} />
      </RowSection>

      <RowSection title="Sacrament">
        <RowHymn
          label="Sacrament hymn"
          number={m?.sacramentHymn?.number}
          title={m?.sacramentHymn?.title}
        />
        <RowLabeled label="Bread" value={personName(m?.sacramentBread)} />
        <RowLabeled label="Blesser 1" value={personName(m?.sacramentBlessers?.[0])} />
        <RowLabeled label="Blesser 2" value={personName(m?.sacramentBlessers?.[1])} />
      </RowSection>

      <ScriptLine>Thank the congregation for their reverence.</ScriptLine>

      <RowSection title="Speakers & music">
        <ScriptLine>
          Introduce <strong className="not-italic">{speaker1 ?? "Speaker 1"}</strong>
          {sequence.some((e) => e.kind === "mid") && <> and the musical number / rest hymn that follows.</>}
        </ScriptLine>
        {sequence.map((entry, i) =>
          entry.kind === "speaker" ? (
            <RowLabeled
              key={`s-${entry.data.id}`}
              label={`Speaker ${entry.index + 1}`}
              value={entry.data.name}
            />
          ) : (
            <RowLabeled key={`mid-${i}`} label="Interlude" value={entry.label} />
          ),
        )}
        {speaker2 && (
          <ScriptLine>
            Thank the pianist / chorister and earlier participants. Introduce{" "}
            <strong className="not-italic">{speaker2}</strong>, then mention the closing hymn and
            benediction.
          </ScriptLine>
        )}
      </RowSection>

      <RowSection title="Closing">
        <RowHymn label="Closing hymn" number={m?.closingHymn?.number} title={m?.closingHymn?.title} />
        <RowLabeled label="Benediction" value={personName(m?.benediction)} />
      </RowSection>
    </PrintLayout>
  );
}
