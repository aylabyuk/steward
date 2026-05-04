import type { WithId } from "@/hooks/_sub";
import type { SacramentMeeting, Speaker, Ward } from "@/lib/types";
import { renderProgramState } from "@/features/program-templates/utils/programTemplateRender";
import { LegacyConductingCopy } from "./LegacyConductingCopy";
import { buildMeetingVariables } from "./utils/buildMeetingVariables";
import { formatLongDate, orderedSpeakers, speakerSequence } from "./utils/programData";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: readonly WithId<Speaker>[];
  ward: Ward | null;
  templateJson: string | null;
}

/** Pure rendering of the conducting copy: header + (template path |
 *  legacy fallback). No data loading, no readiness gate, no print
 *  trigger. Both the print route and the on-screen prepare-to-print
 *  preview render through this. */
export function ConductingProgramBody({ date, meeting, speakers, ward, templateJson }: Props) {
  const wardName = ward?.name ?? "our ward";
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

  if (templateJson) {
    const variables = buildMeetingVariables({ date, meeting, speakers, ward });
    return (
      <>
        {header}
        {renderProgramState(templateJson, variables)}
      </>
    );
  }

  const speakerList = orderedSpeakers(speakers);
  const sequence = speakerSequence(speakerList, meeting?.mid);
  const visitors = (meeting?.visitors ?? []).filter((v) => v.name.trim().length > 0);

  return (
    <>
      {header}
      <LegacyConductingCopy
        m={meeting}
        wardName={wardName}
        dateLong={dateLong}
        speakerList={speakerList}
        sequence={sequence}
        visitors={visitors}
      />
    </>
  );
}
