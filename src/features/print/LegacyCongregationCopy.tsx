import type { SacramentMeeting } from "@/lib/types";
import { personName, type SequenceEntry } from "./utils/programData";
import { RowHymn, RowLabeled, RowSection } from "./utils/programRows";

interface Props {
  m: SacramentMeeting | null;
  wardName: string;
  dateLong: string;
  sequence: readonly SequenceEntry[];
  visitorText: string;
}

/** Hand-built congregation copy used for wards that haven't authored
 *  a custom template yet. The template-driven path in
 *  `CongregationProgram` takes precedence once a template is saved. */
export function LegacyCongregationCopy({ m, wardName, dateLong, sequence, visitorText }: Props) {
  return (
    <>
      <header className="mb-6 border-b-2 border-walnut pb-2">
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
        <RowLabeled label="Opening Prayer" value={personName(m?.openingPrayer)} dense />
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
        <RowLabeled label="Closing Prayer" value={personName(m?.benediction)} dense />
      </RowSection>
    </>
  );
}
