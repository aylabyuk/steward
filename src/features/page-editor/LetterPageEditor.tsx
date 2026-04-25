import { useState } from "react";
import type { LetterPageStyle } from "@/lib/types/template";
import { LetterRenderContextProvider } from "./letterRenderContext";
import {
  LETTER_EDITOR_NODES,
  LETTER_SLASH_COMMANDS,
  buildInitialLetterState,
} from "./letterEditorConfig";
import { PageCanvas } from "./PageCanvas";
import { PageEditorComposer } from "./PageEditorComposer";
import { PageStage } from "./PageStage";
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
  /** Optional page-frame styling (border + paper / size / orientation). */
  pageStyle?: LetterPageStyle;
  onChange: (stateJson: string) => void;
  onInitial?: (stateJson: string) => void;
  onPageStyleChange?: (next: LetterPageStyle) => void;
  ariaLabel: string;
  editorDisabled?: boolean;
}

/** WYSIWYG speaker-letter editor — Word-style layout: full-width
 *  sticky toolbar at top, then a zoomable scrollable PageStage that
 *  centers the paper. Header chrome (ornament, eyebrow, title, etc.)
 *  is part of the editor's content (see `buildInitialLetterState`),
 *  so every text on the printed letter is editable. */
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
  const [zoom, setZoom] = useState(1);
  return (
    <LetterRenderContextProvider assignedDate={assignedDate}>
      <div
        className={`flex flex-col h-full w-full ${editorDisabled ? "opacity-60 pointer-events-none" : ""}`}
      >
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
              zoom={zoom}
              onZoomChange={setZoom}
              {...(onPageStyleChange ? { onPageStyleChange } : {})}
            />
          }
          page={(contentEditable) => (
            <div className="flex-1 min-h-0">
              <PageStage zoom={zoom} onZoomChange={setZoom}>
                <PageCanvas variant="letter" pageStyle={pageStyle} chrome={null}>
                  <div className="font-serif text-[16.5px] leading-[1.65] text-walnut-2">
                    {contentEditable}
                  </div>
                </PageCanvas>
              </PageStage>
            </div>
          )}
        />
      </div>
    </LetterRenderContextProvider>
  );
}
