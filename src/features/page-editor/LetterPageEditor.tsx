import { useRef, useState } from "react";
import type { LetterPageStyle } from "@/lib/types/template";
import { LetterRenderContextProvider } from "./letterRenderContext";
import {
  LETTER_EDITOR_NODES,
  LETTER_SLASH_COMMANDS,
  buildInitialLetterState,
} from "./letterEditorConfig";
import {
  LETTER_VARIABLE_GROUP_LABEL,
  LETTER_VARIABLE_SAMPLES,
  LETTER_VARIABLES,
} from "./letterVariables";
import { PageEditorComposer } from "./PageEditorComposer";
import { PaginatedPageStage } from "./PaginatedPageStage";
import { useFitZoom } from "./useFitZoom";
import { VariableRegistryProvider } from "./variableRegistry";
import { PageToolbar } from "./toolbar/PageToolbar";
import type { ZoomMode } from "./toolbar/ZoomMenu";

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
  /** When true, render the bordeaux "Preview — sample values shown"
   *  banner below the toolbar. Template-editor surface turns it on;
   *  per-speaker editors leave it off because chips there already
   *  resolve to the real speaker's values. */
  showSampleNotice?: boolean;
  /** Variable bag the chips + Callout / Letterhead / Signature props
   *  resolve against. Per-speaker editors (wizard, prepare-invite)
   *  pass the real speaker / ward values so chips render
   *  "Sister Park" instead of the static "Brother Park" sample.
   *  Template editor omits this — falls back to LETTER_VARIABLE_SAMPLES
   *  and the bordeaux banner explains why. */
  vars?: Readonly<Record<string, string>>;
  onChange: (stateJson: string) => void;
  onInitial?: (stateJson: string) => void;
  onPageStyleChange?: (next: LetterPageStyle) => void;
  ariaLabel: string;
  editorDisabled?: boolean;
}

/** WYSIWYG speaker-letter editor — Word-style layout: full-width
 *  sticky toolbar at top, then a paginated zoomable stage that
 *  centers the paper. Header chrome (ornament, eyebrow, title, etc.)
 *  is part of the editor's content (see `buildInitialLetterState`),
 *  so every text on the printed letter is editable. */
export function LetterPageEditor({
  assignedDate,
  initialJson,
  initialMarkdown,
  pageStyle,
  showSampleNotice,
  vars,
  onChange,
  onInitial,
  onPageStyleChange,
  ariaLabel,
  editorDisabled,
}: Props) {
  const initialState = initialJson ?? buildInitialLetterState(initialMarkdown);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>({ kind: "fit-page" });
  const fits = useFitZoom(scrollRef, pageStyle);
  const zoom =
    zoomMode.kind === "fit-width"
      ? fits.fitWidth
      : zoomMode.kind === "fit-page"
        ? fits.fitPage
        : zoomMode.value;
  return (
    <LetterRenderContextProvider assignedDate={assignedDate} vars={vars ?? LETTER_VARIABLE_SAMPLES}>
      <VariableRegistryProvider
        variables={LETTER_VARIABLES}
        groupLabels={LETTER_VARIABLE_GROUP_LABEL}
      >
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
                variables={LETTER_VARIABLES}
                variableGroupLabels={LETTER_VARIABLE_GROUP_LABEL}
                pageStyle={pageStyle}
                zoom={zoom}
                zoomMode={zoomMode}
                onZoomMode={setZoomMode}
                {...(onPageStyleChange ? { onPageStyleChange } : {})}
              />
            }
            noticeBar={
              showSampleNotice ? (
                <div className="w-full bg-bordeaux text-chalk text-center font-mono text-[11px] uppercase tracking-[0.16em] py-2 px-4">
                  Preview — variable chips show sample values. Actual speaker / ward values fill in
                  when sent.
                </div>
              ) : undefined
            }
            page={(contentEditable) => (
              <div className="flex-1 min-h-0">
                <PaginatedPageStage
                  variant="letter"
                  pageStyle={pageStyle}
                  zoom={zoom}
                  onZoomChange={(v) => setZoomMode({ kind: "manual", value: v })}
                  scrollRef={scrollRef}
                >
                  <div className="font-serif text-[16.5px] leading-[1.65] text-walnut-2">
                    {contentEditable}
                  </div>
                </PaginatedPageStage>
              </div>
            )}
          />
        </div>
      </VariableRegistryProvider>
    </LetterRenderContextProvider>
  );
}
