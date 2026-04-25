import { useMemo } from "react";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { PrintOnlyLetter } from "./PrintOnlyLetter";
import { interpolate } from "./interpolate";
import type { LetterVars } from "./prepareInvitationVars";

interface Props {
  initialJson: string | null;
  initialMarkdown: { bodyMarkdown: string; footerMarkdown: string };
  body: string;
  footer: string;
  onChange: (json: string) => void;
  onInitial: (json: string) => void;
  resetKey: number;
  vars: LetterVars;
  /** Optional toolbar slot rendered absolute-top-right of the editor
   *  surface. Phase 2 keeps the existing per-speaker action bar
   *  composed by the parent. */
  previewToolbar?: React.ReactNode;
}

/** Per-speaker letter editor on the prepare-invitation route — same
 *  WYSIWYG canvas as the ward template page. The legacy split-pane
 *  preview is gone; the editor IS the preview. PrintOnlyLetter
 *  continues to portal a true 8.5×11 sheet for the print path during
 *  the JSON dual-write window. */
export function PrepareInvitationLetterTab({
  initialJson,
  initialMarkdown,
  body,
  footer,
  onChange,
  onInitial,
  resetKey,
  vars,
  previewToolbar,
}: Props) {
  const renderedBody = useMemo(() => interpolate(body, vars), [body, vars]);
  const renderedFooter = useMemo(() => interpolate(footer, vars), [footer, vars]);

  return (
    <>
      <PrintOnlyLetter
        wardName={vars.wardName}
        assignedDate={vars.date}
        today={vars.today}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
      />
      <div className="relative h-full">
        {previewToolbar && <div className="absolute top-3 right-3 z-10">{previewToolbar}</div>}
        <LetterPageEditor
          key={resetKey}
          assignedDate={vars.date}
          initialJson={initialJson}
          initialMarkdown={initialMarkdown}
          onChange={onChange}
          onInitial={onInitial}
          ariaLabel={`Letter for ${vars.speakerName}`}
        />
      </div>
    </>
  );
}
