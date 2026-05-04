import type { WithId } from "@/hooks/_sub";
import type { SacramentMeeting, Speaker, Ward } from "@/lib/types";
import { renderProgramState } from "@/features/program-templates/utils/programTemplateRender";
import { LegacyCongregationCopy } from "./LegacyCongregationCopy";
import { buildMeetingVariables } from "./utils/buildMeetingVariables";
import { formatLongDate, orderedSpeakers, speakerSequence } from "./utils/programData";
import { resolveProgramFooterNote } from "./utils/programFooter";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: readonly WithId<Speaker>[];
  ward: Ward | null;
  templateJson: string | null;
  /** Per-meeting override for the program footer note. Undefined →
   *  fall through to ward default → built-in default; empty string
   *  → hide. The congregation prepare tab passes a draft value here
   *  so the preview updates live as the user types. */
  footerNoteOverride?: string | undefined;
}

/** Pure rendering of one congregation copy (with its own header). The
 *  print route emits this twice in a two-column landscape grid; the
 *  prepare-to-print preview emits it once. */
export function CongregationProgramBody({
  date,
  meeting,
  speakers,
  ward,
  templateJson,
  footerNoteOverride,
}: Props) {
  const wardName = ward?.name ?? "Ward";
  const dateLong = formatLongDate(date);
  const meetingFooterSource =
    footerNoteOverride !== undefined ? footerNoteOverride : meeting?.programFooterNote;
  const footerNote = resolveProgramFooterNote(
    meetingFooterSource,
    ward?.congregationDefaults?.programFooterNote,
  );

  const body = templateJson ? (
    <>
      <CopyHeader wardName={wardName} dateLong={dateLong} />
      {renderProgramState(templateJson, buildMeetingVariables({ date, meeting, speakers, ward }))}
    </>
  ) : (
    <LegacyBody meeting={meeting} wardName={wardName} dateLong={dateLong} speakers={speakers} />
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">{body}</div>
      {footerNote && (
        <p className="mt-3 pt-2 border-t border-brass-soft font-serif italic text-[12px] text-walnut-2 text-center m-0 shrink-0">
          {footerNote}
        </p>
      )}
    </div>
  );
}

function LegacyBody({
  meeting,
  wardName,
  dateLong,
  speakers,
}: {
  meeting: SacramentMeeting | null;
  wardName: string;
  dateLong: string;
  speakers: readonly WithId<Speaker>[];
}) {
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
    <header className="mb-6 border-b-2 border-walnut pb-2">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brass-deep">
        Sacrament meeting · {wardName}
      </div>
      <h1 className="font-display text-[17px] font-semibold text-walnut tracking-[-0.02em] m-0 mt-0.5">
        {dateLong}
      </h1>
    </header>
  );
}
