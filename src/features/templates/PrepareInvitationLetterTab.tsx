import { useMemo } from "react";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { MobileLetterPreview } from "@/features/page-editor/MobileLetterPreview";
import { resolveChipsInState } from "@/features/page-editor/utils/serializeForInterpolation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { PrintOnlyLetter } from "./PrintOnlyLetter";
import { interpolate } from "./utils/interpolate";
import type { LetterVars } from "./utils/prepareInvitationVars";

interface Props {
  initialJson: string | null;
  initialMarkdown: { bodyMarkdown: string; footerMarkdown: string };
  /** Live editor JSON — reflects the current canvas as the bishop
   *  edits. Used to bake an interpolated + chip-resolved state for
   *  the OS print path so the print preview matches what's on
   *  screen (chip color, italic, signatory, letterhead). null when
   *  the parent doesn't own a live JSON yet. */
  liveStateJson?: string | null;
  body: string;
  footer: string;
  onChange: (json: string) => void;
  onInitial: (json: string) => void;
  resetKey: number;
  vars: LetterVars;
  /** Reference-only metadata stamp threaded into the off-screen
   *  PrintOnlyLetter portal so the PDF export carries it. The on-
   *  screen editor + mobile preview deliberately omit it — pure
   *  reference metadata, not part of the letter content. */
  printVersionStamp?: { label: "Saved" | "Sent"; text: string };
}

/** Per-speaker letter editor on the prepare-invitation route — same
 *  WYSIWYG canvas as the ward template page. The legacy split-pane
 *  preview is gone; the editor IS the preview. PrintOnlyLetter
 *  continues to portal a true 8.5×11 sheet for the print path during
 *  the JSON dual-write window. */
export function PrepareInvitationLetterTab({
  initialJson,
  initialMarkdown,
  liveStateJson,
  body,
  footer,
  onChange,
  onInitial,
  resetKey,
  vars,
  printVersionStamp,
}: Props) {
  const isMobile = useIsMobile();
  const renderedBody = useMemo(() => interpolate(body, vars), [body, vars]);
  const renderedFooter = useMemo(() => interpolate(footer, vars), [footer, vars]);
  const printEditorStateJson = useMemo(() => {
    const src = liveStateJson ?? initialJson;
    if (!src) return undefined;
    return resolveChipsInState(interpolate(src, vars), vars);
  }, [liveStateJson, initialJson, vars]);

  return (
    <>
      <PrintOnlyLetter
        wardName={vars.wardName}
        assignedDate={vars.date}
        today={vars.today}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
        {...(printEditorStateJson ? { editorStateJson: printEditorStateJson } : {})}
        {...(printVersionStamp ? { versionStamp: printVersionStamp } : {})}
      />
      <div className="relative h-full">
        {isMobile ? (
          <MobileLetterPreview
            wardName={vars.wardName}
            assignedDate={vars.date}
            today={vars.today}
            bodyMarkdown={renderedBody}
            footerMarkdown={renderedFooter}
            editorStateJson={liveStateJson ?? initialJson}
            vars={vars}
          />
        ) : (
          <LetterPageEditor
            key={resetKey}
            assignedDate={vars.date}
            initialJson={initialJson}
            initialMarkdown={initialMarkdown}
            vars={vars}
            onChange={onChange}
            onInitial={onInitial}
            ariaLabel={`Letter for ${vars.speakerName}`}
          />
        )}
      </div>
    </>
  );
}
