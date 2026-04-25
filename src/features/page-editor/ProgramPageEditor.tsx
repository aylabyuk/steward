import type { ProgramTemplateKey } from "@/lib/types";
import { PAGE_EDITOR_BASE_NODES } from "./pageEditorNodes";
import { PageCanvas } from "./PageCanvas";
import { PageEditorComposer } from "./PageEditorComposer";
import { PROGRAM_SLASH_COMMANDS } from "./programSlashCommands";

interface Props {
  variant: ProgramTemplateKey;
  initialJson: string | null;
  onChange: (json: string) => void;
  onInitial?: (json: string) => void;
  ariaLabel: string;
  editorDisabled?: boolean;
}

const VARIANT_LABEL: Record<ProgramTemplateKey, string> = {
  conductingProgram: "Conducting copy",
  congregationProgram: "Congregation copy",
};

/** WYSIWYG program template editor — same canvas-as-page paradigm as
 *  the letter, with program-specific slash commands (variables for
 *  every PROGRAM_VARIABLES token, plus structural blocks). The page
 *  itself acts as the visual frame; the bishop authors directly into
 *  the paper. */
export function ProgramPageEditor({
  variant,
  initialJson,
  onChange,
  onInitial,
  ariaLabel,
  editorDisabled,
}: Props) {
  const canvasVariant = variant === "conductingProgram" ? "conducting" : "congregation";
  return (
    <div
      className={`relative max-w-[8.5in] mx-auto ${editorDisabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      <PageEditorComposer
        namespace={`ProgramPageEditor:${variant}`}
        nodes={PAGE_EDITOR_BASE_NODES}
        initialState={initialJson}
        onChange={onChange}
        onInitial={onInitial}
        ariaLabel={ariaLabel}
        slashCommands={PROGRAM_SLASH_COMMANDS}
        page={(contentEditable) => (
          <PageCanvas
            variant={canvasVariant}
            chrome={
              <div className="text-center pb-3 border-b border-border mb-4">
                <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-walnut-3">
                  Sacrament Meeting · {VARIANT_LABEL[variant]}
                </div>
              </div>
            }
          >
            <div className="font-serif text-[15px] leading-[1.6] text-walnut">
              {contentEditable}
            </div>
          </PageCanvas>
        )}
      />
    </div>
  );
}
