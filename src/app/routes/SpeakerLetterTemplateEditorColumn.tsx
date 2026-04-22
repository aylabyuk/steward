import { MobileLetterPreviewButton } from "@/features/templates/MobileLetterPreviewButton";
import { SpeakerLetterGuide } from "@/features/templates/SpeakerLetterGuide";
import { EditorSection } from "@/features/templates/SpeakerLetterEditor";

interface Props {
  resetKey: number;
  body: string;
  footer: string;
  setBody: (v: string) => void;
  setFooter: (v: string) => void;
  canEdit: boolean;
  seeded: boolean;
  error: string | null;
  wardName: string;
  sampleDate: string;
  sampleToday: string;
  renderedBody: string;
  renderedFooter: string;
}

/** Left column of the ward letter-template settings page: the mobile
 *  preview FAB trigger, the variables guide, the two editor sections,
 *  and any inline error. Extracted so the route file stays under the
 *  150-LOC ceiling. */
export function SpeakerLetterTemplateEditorColumn(props: Props) {
  return (
    <div
      key={props.resetKey}
      className="flex flex-col gap-4 min-w-0 lg:h-[calc(100dvh-10rem)] lg:overflow-y-auto lg:pr-2"
    >
      <MobileLetterPreviewButton
        wardName={props.wardName}
        assignedDate={props.sampleDate}
        today={props.sampleToday}
        bodyMarkdown={props.renderedBody}
        footerMarkdown={props.renderedFooter}
      />
      <SpeakerLetterGuide />
      {props.seeded ? (
        <>
          <EditorSection
            label="Letter body"
            initialMarkdown={props.body}
            onChange={props.setBody}
            disabled={!props.canEdit}
          />
          <EditorSection
            label="Footer (scripture)"
            initialMarkdown={props.footer}
            onChange={props.setFooter}
            disabled={!props.canEdit}
          />
        </>
      ) : (
        <p className="font-serif italic text-[14px] text-walnut-3">Loading template…</p>
      )}
      {props.error && <p className="font-sans text-[12.5px] text-bordeaux">{props.error}</p>}
    </div>
  );
}
