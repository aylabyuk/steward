import { useRef, useState } from "react";
import type { LetterPageStyle, ProgramTemplateKey } from "@/lib/types";
import {
  GROUP_LABEL,
  PROGRAM_VARIABLES,
} from "@/features/program-templates/utils/programVariables";
import { PAGE_EDITOR_BASE_NODES } from "./utils/pageEditorNodes";
import { PageEditorComposer } from "./PageEditorComposer";
import { PaginatedPageStage } from "./PaginatedPageStage";
import { useFitZoom } from "./hooks/useFitZoom";
import { VariableRegistryProvider } from "./utils/variableRegistry";
import { PROGRAM_SLASH_COMMANDS } from "./utils/programSlashCommands";
import { PageToolbar } from "./toolbar/PageToolbar";
import type { ZoomMode } from "./toolbar/ZoomMenu";

interface Props {
  variant: ProgramTemplateKey;
  initialJson: string | null;
  pageStyle?: LetterPageStyle | null;
  onChange: (json: string) => void;
  onInitial?: (json: string) => void;
  onPageStyleChange?: (next: LetterPageStyle) => void;
  ariaLabel: string;
  editorDisabled?: boolean;
  /** When true, render the bordeaux "Preview — sample values shown"
   *  banner below the toolbar. Programs template editor turns it on
   *  so the bishop knows the chips on the page (Brother Park, etc.)
   *  are placeholders that resolve to real meeting data at print
   *  time. */
  showSampleNotice?: boolean;
}

/** WYSIWYG program template editor — Word-style layout: full-width
 *  sticky toolbar, then a paginated zoomable stage that centers the
 *  paper. Header line ("Sacrament Meeting · …") lives in the
 *  template content, not chrome, so every word is editable. */
export function ProgramPageEditor({
  variant,
  initialJson,
  pageStyle,
  onChange,
  onInitial,
  onPageStyleChange,
  ariaLabel,
  editorDisabled,
  showSampleNotice,
}: Props) {
  const canvasVariant = variant === "conductingProgram" ? "conducting" : "congregation";
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>({ kind: "fit-page" });
  const fits = useFitZoom(scrollRef, pageStyle ?? null);
  const zoom =
    zoomMode.kind === "fit-width"
      ? fits.fitWidth
      : zoomMode.kind === "fit-page"
        ? fits.fitPage
        : zoomMode.value;
  return (
    <VariableRegistryProvider variables={PROGRAM_VARIABLES} groupLabels={GROUP_LABEL}>
      <div
        className={`flex flex-col h-full w-full ${editorDisabled ? "opacity-60 pointer-events-none" : ""}`}
      >
        <PageEditorComposer
          namespace={`ProgramPageEditor:${variant}`}
          nodes={PAGE_EDITOR_BASE_NODES}
          initialState={initialJson}
          onChange={onChange}
          onInitial={onInitial}
          ariaLabel={ariaLabel}
          slashCommands={PROGRAM_SLASH_COMMANDS}
          pageToolbar={
            <PageToolbar
              slashCommands={PROGRAM_SLASH_COMMANDS}
              variables={PROGRAM_VARIABLES}
              variableGroupLabels={GROUP_LABEL}
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
                Preview — variable chips show sample values. Actual meeting / speaker values fill in
                at print time.
              </div>
            ) : undefined
          }
          page={(contentEditable) => (
            <div className="flex-1 min-h-0">
              <PaginatedPageStage
                variant={canvasVariant}
                pageStyle={pageStyle ?? undefined}
                zoom={zoom}
                onZoomChange={(v) => setZoomMode({ kind: "manual", value: v })}
                scrollRef={scrollRef}
              >
                <div className="font-serif text-[15px] leading-[1.6] text-walnut">
                  {contentEditable}
                </div>
              </PaginatedPageStage>
            </div>
          )}
        />
      </div>
    </VariableRegistryProvider>
  );
}
