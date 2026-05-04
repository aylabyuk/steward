import type { WithId } from "@/hooks/_sub";
import type { SacramentMeeting, Speaker, Ward } from "@/lib/types";
import { renderProgramState } from "@/features/program-templates/utils/programTemplateRender";
import { LegacyCongregationCopy } from "./LegacyCongregationCopy";
import { buildMeetingVariables } from "./utils/buildMeetingVariables";
import { formatLongDate, orderedSpeakers, speakerSequence } from "./utils/programData";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: readonly WithId<Speaker>[];
  ward: Ward | null;
  templateJson: string | null;
}

/** Pure rendering of one congregation copy (with its own header). The
 *  print route emits this twice in a two-column landscape grid; the
 *  prepare-to-print preview emits it once. */
export function CongregationProgramBody({ date, meeting, speakers, ward, templateJson }: Props) {
  const wardName = ward?.name ?? "Ward";
  const dateLong = formatLongDate(date);

  if (templateJson) {
    const variables = buildMeetingVariables({ date, meeting, speakers, ward });
    return (
      <>
        <CopyHeader wardName={wardName} dateLong={dateLong} />
        {renderProgramState(templateJson, variables)}
      </>
    );
  }

  const speakerList = orderedSpeakers(speakers);
  const sequence = speakerSequence(speakerList, meeting?.mid);
  const visitors = (meeting?.visitors ?? []).filter((v) => v.name.trim().length > 0);
  const visitorText = visitors
    .map((v) => (v.details ? `${v.name} (${v.details})` : v.name))
    .join(", ");

  return (
    <LegacyCongregationCopy
      m={meeting}
      wardName={wardName}
      dateLong={dateLong}
      sequence={sequence}
      visitorText={visitorText}
    />
  );
}

function CopyHeader({ wardName, dateLong }: { wardName: string; dateLong: string }) {
  return (
    <header className="mb-3 border-b-2 border-walnut pb-2">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brass-deep">
        Sacrament meeting · {wardName}
      </div>
      <h1 className="font-display text-[17px] font-semibold text-walnut tracking-[-0.02em] m-0 mt-0.5">
        {dateLong}
      </h1>
    </header>
  );
}
