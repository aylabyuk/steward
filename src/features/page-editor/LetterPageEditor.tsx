import type { LetterPageStyle } from "@/lib/types/template";
import { LetterRenderContextProvider } from "./letterRenderContext";
import {
  LETTER_EDITOR_NODES,
  LETTER_SLASH_COMMANDS,
  buildInitialLetterState,
} from "./letterEditorConfig";
import { PageCanvas } from "./PageCanvas";
import { PageEditorComposer } from "./PageEditorComposer";
import { PageStylePanel } from "./PageStylePanel";
import { PageToolbar } from "./toolbar/PageToolbar";

interface Props {
  /** Sample assigned-Sunday date for the AssignedSundayCalloutNode in
   *  authoring view. Per-speaker contexts (wizard, send) override this. */
  assignedDate: string;
  /** Existing Lexical state JSON, if the ward has saved one already. */
  initialJson: string | null;
  /** Legacy markdown fallback — used when the ward only has the old
   *  fields stored. The seed function hydrates these via the markdown
   *  transformers and splices in the assigned-Sunday callout +
   *  signature block + footer scripture paragraph. */
  initialMarkdown: { bodyMarkdown: string; footerMarkdown: string };
  /** Optional page-frame styling (border + paper). */
  pageStyle?: LetterPageStyle;
  /** Fires on every user edit with the editor state serialised as
   *  Lexical JSON. */
  onChange: (stateJson: string) => void;
  /** Fires once after hydration with the initial editor state — the
   *  host should seed both working + saved baselines so dirty starts
   *  clean. Without this, pageStyle-only edits couldn't be saved. */
  onInitial?: (stateJson: string) => void;
  /** Fires when the bishop edits the page style. Omit to hide the
   *  page-style panel (e.g. read-only contexts, the wizard's per-
   *  speaker preview). */
  onPageStyleChange?: (next: LetterPageStyle) => void;
  ariaLabel: string;
  /** When true, the editor is read-only (e.g. the user lacks edit
   *  permission). */
  editorDisabled?: boolean;
}

/** Composes the WYSIWYG speaker-letter editor: page canvas with the
 *  letter chrome (ornament, eyebrow, title, date) wrapping a single
 *  Lexical contenteditable that owns greeting + body + assigned-Sunday
 *  callout + signature + closing scripture as one continuous flow. */
export function LetterPageEditor({
  assignedDate,
  initialJson,
  initialMarkdown,
  pageStyle,
  onChange,
  onInitial,
  onPageStyleChange,
  ariaLabel,
  editorDisabled,
}: Props) {
  const initialState = initialJson ?? buildInitialLetterState(initialMarkdown);
  return (
    <LetterRenderContextProvider assignedDate={assignedDate}>
      <div
        className={`relative max-w-[8.5in] mx-auto ${editorDisabled ? "opacity-60 pointer-events-none" : ""}`}
      >
        {onPageStyleChange && (
          <PageStylePanel
            value={pageStyle}
            onChange={onPageStyleChange}
            disabled={editorDisabled}
          />
        )}
        <PageEditorComposer
          namespace="LetterPageEditor"
          nodes={LETTER_EDITOR_NODES}
          initialState={initialState}
          onChange={onChange}
          onInitial={onInitial}
          ariaLabel={ariaLabel}
          slashCommands={LETTER_SLASH_COMMANDS}
          pageToolbar={
            <PageToolbar
              slashCommands={LETTER_SLASH_COMMANDS}
              pageStyle={pageStyle}
              {...(onPageStyleChange ? { onPageStyleChange } : {})}
            />
          }
          page={(contentEditable) => (
            <PageCanvas variant="letter" pageStyle={pageStyle} chrome={null}>
              <div className="font-serif text-[16.5px] leading-[1.65] text-walnut-2">
                {contentEditable}
              </div>
            </PageCanvas>
          )}
        />
      </div>
    </LetterRenderContextProvider>
  );
}
