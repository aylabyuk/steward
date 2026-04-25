import { useState } from "react";
import type { LetterPageStyle, ProgramTemplateKey } from "@/lib/types";
import { PAGE_EDITOR_BASE_NODES } from "./pageEditorNodes";
import { PageCanvas } from "./PageCanvas";
import { PageEditorComposer } from "./PageEditorComposer";
import { PageStage } from "./PageStage";
import { PROGRAM_SLASH_COMMANDS } from "./programSlashCommands";
import { PageToolbar } from "./toolbar/PageToolbar";

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
 *  sticky toolbar, then a zoomable scrollable PageStage that centers
 *  the paper. Header line ("Sacrament Meeting · …") lives in the
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
  const [zoom, setZoom] = useState(1);
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
            pageStyle={pageStyle}
            zoom={zoom}
            onZoomChange={setZoom}
            {...(onPageStyleChange ? { onPageStyleChange } : {})}
          />
        }
        page={(contentEditable) => (
          <div className="flex-1 min-h-0">
            <PageStage zoom={zoom} onZoomChange={setZoom}>
              <PageCanvas variant={canvasVariant} pageStyle={pageStyle ?? undefined} chrome={null}>
                <div className="font-serif text-[15px] leading-[1.6] text-walnut">
                  {contentEditable}
                </div>
              </PageCanvas>
            </PageStage>
          </div>
        )}
      />
    </div>
  );
}
