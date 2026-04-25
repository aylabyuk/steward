import type { LetterPageStyle, ProgramTemplateKey } from "@/lib/types";
import { PAGE_EDITOR_BASE_NODES } from "./pageEditorNodes";
import { PageCanvas } from "./PageCanvas";
import { PageEditorComposer } from "./PageEditorComposer";
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

/** WYSIWYG program template editor — same canvas-as-page paradigm as
 *  the letter, with program-specific slash commands (variables for
 *  every PROGRAM_VARIABLES token, plus structural blocks). The page
 *  itself acts as the visual frame; the bishop authors directly into
 *  the paper. The header line ("Sacrament Meeting · …") lives in the
 *  template content (see programTemplateDefaults) so the bishop can
 *  edit every word on the printed program. */
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
  return (
    <div className={editorDisabled ? "opacity-60 pointer-events-none" : undefined}>
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
            {...(onPageStyleChange ? { onPageStyleChange } : {})}
          />
        }
        page={(contentEditable) => (
          <PageCanvas variant={canvasVariant} pageStyle={pageStyle ?? undefined} chrome={null}>
            <div className="font-serif text-[15px] leading-[1.6] text-walnut">
              {contentEditable}
            </div>
          </PageCanvas>
        )}
      />
    </div>
  );
}
