import { cn } from "@/lib/cn";
import { MarkdownEditor } from "@/features/templates/MarkdownEditor";
import { SPEAKER_LETTER_GROUP_LABEL, SPEAKER_LETTER_VARIABLES } from "./speakerLetterVariables";

interface Props {
  className?: string;
  body: string;
  footer: string;
  resetKey: number;
  canEdit: boolean;
  editorWidth: number;
  onBodyChange: (md: string) => void;
  onFooterChange: (md: string) => void;
}

/** Left/right-positioned column that hosts the body Lexical editor +
 *  a single-line scripture footer input. Extracted from
 *  SpeakerLetterPanel so the panel itself stays under the LOC cap. */
export function SpeakerLetterEditorColumn({
  className,
  body,
  footer,
  resetKey,
  canEdit,
  editorWidth,
  onBodyChange,
  onFooterChange,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 w-full lg:h-full lg:min-h-0 lg:w-(--editor-w) lg:shrink-0",
        className,
      )}
      style={{ "--editor-w": `${editorWidth}px` } as React.CSSProperties}
    >
      <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
        Letter body
      </div>
      <div className="lg:flex-1 lg:min-h-0 flex flex-col">
        <MarkdownEditor
          key={resetKey}
          ariaLabel="Letter body"
          initialMarkdown={body}
          onChange={onBodyChange}
          variables={SPEAKER_LETTER_VARIABLES}
          groupLabels={SPEAKER_LETTER_GROUP_LABEL}
          placeholder="Write the letter — text, lists, scripture, variables…"
        />
      </div>
      <div className="shrink-0 mt-2 flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
          Footer (scripture)
        </span>
        <input
          key={`footer-${resetKey}`}
          defaultValue={footer}
          onChange={(e) => onFooterChange(e.target.value)}
          disabled={!canEdit}
          placeholder="*Single italic line of scripture* — Reference"
          className="font-serif italic text-[13.5px] px-3 py-2 bg-chalk border border-border rounded-md text-walnut placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
      {!canEdit && (
        <p className="mt-2 font-sans text-[12px] text-walnut-3 shrink-0">
          Read-only — only active members can edit ward templates.
        </p>
      )}
    </div>
  );
}
