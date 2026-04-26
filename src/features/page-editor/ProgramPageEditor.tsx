import { useRef, useState } from "react";
import type { LetterPageStyle, ProgramTemplateKey } from "@/lib/types";
import { GROUP_LABEL, PROGRAM_VARIABLES } from "@/features/program-templates/programVariables";
import { PAGE_EDITOR_BASE_NODES } from "./pageEditorNodes";
import { PageEditorComposer } from "./PageEditorComposer";
import { PaginatedPageStage } from "./PaginatedPageStage";
import { useFitZoom } from "./useFitZoom";
import { PROGRAM_SLASH_COMMANDS } from "./programSlashCommands";
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
  );
}
