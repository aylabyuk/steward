import type { ReactNode } from "react";
import type { SacramentMeeting } from "@/lib/types";
import { type OrderedSpeaker, personName, type SequenceEntry } from "./utils/programData";
import { RowFreeform, RowHymn, RowLabeled, ScriptLine } from "./utils/programRows";

function Group({ children }: { children: ReactNode }) {
  return <section className="mt-3.5 mb-1.5 flex flex-col">{children}</section>;
}

interface Props {
  m: SacramentMeeting | null;
  wardName: string;
  dateLong: string;
  speakerList: readonly OrderedSpeaker[];
  sequence: readonly SequenceEntry[];
  visitors: readonly { name: string; details?: string | undefined }[];
}

/** Hand-built conducting copy used for wards that haven't authored a
 *  custom template yet. The template-driven path in
 *  `ConductingProgram` takes precedence once a template is saved. */
export function LegacyConductingCopy({
  m,
  wardName,
  dateLong,
  speakerList,
  sequence,
  visitors,
}: Props) {
  const speaker1 = speakerList[0]?.name;
  const speaker2 = speakerList[1]?.name;
  return (
    <>
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
        <RowHymn
          label="Opening hymn"
          number={m?.openingHymn?.number}
          title={m?.openingHymn?.title}
          dense
        />
        <RowLabeled label="Opening Prayer" value={personName(m?.openingPrayer)} dense />
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
          {sequence.some((e) => e.kind === "mid") && (
            <> and the musical number / rest hymn that follows.</>
          )}
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
            closing prayer.
          </ScriptLine>
        )}
      </Group>

      <Group>
        <RowHymn
          label="Closing hymn"
          number={m?.closingHymn?.number}
          title={m?.closingHymn?.title}
          dense
        />
        <RowLabeled label="Closing Prayer" value={personName(m?.benediction)} dense />
      </Group>
    </>
  );
}
