import type { LetterPageStyle, PrayerParticipant } from "@/lib/types";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { MobileLetterPreview } from "@/features/page-editor/MobileLetterPreview";
import {
  PRAYER_LETTER_VARIABLE_GROUP_LABEL,
  PRAYER_LETTER_VARIABLES,
  PRAYER_LETTER_VARIABLE_SAMPLES,
} from "@/features/page-editor/prayerLetterVariables";
import { buildInitialPrayerLetterState } from "@/features/page-editor/prayerLetterEditorConfig";
import type { usePreparePrayerInvitation } from "@/features/prayers/usePreparePrayerInvitation";

interface Props {
  participant: PrayerParticipant;
  wardName: string;
  assignedDate: string;
  today: string;
  renderedBody: string;
  renderedFooter: string;
  vars: Readonly<Record<string, string>>;
  pageStyle: LetterPageStyle | null;
  onPageStyleChange: (next: LetterPageStyle) => void;
  form: ReturnType<typeof usePreparePrayerInvitation>;
}

/** Editor (desktop) vs read-only preview (mobile) branch for the
 *  prayer-wizard's review-letter step. Extracted so
 *  `ReviewPrayerLetterStep` stays under the per-file LOC cap. */
export function PrayerLetterReviewBody(props: Props) {
  const isMobile = useIsMobile();
  const { participant, wardName, assignedDate, today, renderedBody, renderedFooter, vars, form } =
    props;
  if (isMobile) {
    return (
      <MobileLetterPreview
        wardName={wardName}
        assignedDate={assignedDate}
        today={today}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
        editorStateJson={form.letterStateJson ?? form.initialJson}
        vars={vars}
      />
    );
  }
  return (
    <LetterPageEditor
      key={form.resetKey}
      assignedDate={assignedDate}
      initialJson={form.initialJson}
      initialMarkdown={form.initialMarkdown}
      buildInitialState={buildInitialPrayerLetterState}
      variables={PRAYER_LETTER_VARIABLES}
      variableGroupLabels={PRAYER_LETTER_VARIABLE_GROUP_LABEL}
      variableSamples={PRAYER_LETTER_VARIABLE_SAMPLES}
      namespace="PrayerLetterPageEditor"
      {...(props.pageStyle ? { pageStyle: props.pageStyle } : {})}
      onPageStyleChange={props.onPageStyleChange}
      vars={vars}
      onChange={form.setLetterStateJson}
      onInitial={form.captureInitial}
      ariaLabel={`Letter for ${participant.name}`}
    />
  );
}
