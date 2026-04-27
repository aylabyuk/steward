import { useMemo } from "react";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { resolveChipsInState } from "@/features/page-editor/serializeForInterpolation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { PrintOnlyLetter } from "./PrintOnlyLetter";
import { interpolate } from "./interpolate";
import type { LetterVars } from "./prepareInvitationVars";

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
  liveStateJson,
  body,
  footer,
  onChange,
  onInitial,
  resetKey,
  vars,
  previewToolbar,
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
      />
      <div className="relative h-full">
        {previewToolbar && !isMobile && (
          <div className="absolute top-3 right-3 z-10">{previewToolbar}</div>
        )}
        <LetterPageEditor
          key={resetKey}
          assignedDate={vars.date}
          initialJson={initialJson}
          initialMarkdown={initialMarkdown}
          vars={vars}
          onChange={onChange}
          onInitial={onInitial}
          ariaLabel={`Letter for ${vars.speakerName}`}
          readOnly={isMobile}
        />
      </div>
    </>
  );
}
