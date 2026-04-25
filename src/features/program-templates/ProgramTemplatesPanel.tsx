import { useMemo } from "react";
import type { ProgramTemplateKey } from "@/lib/types";
import { MobileProgramPreviewButton } from "./MobileProgramPreviewButton";
import { ProgramTemplateEditor } from "./ProgramTemplateEditor";
import { buildSampleVariables } from "./programTemplateRender";
import { ScaledProgramPreview } from "./ScaledProgramPreview";

interface Props {
  activeKey: ProgramTemplateKey;
  description: string;
  ariaLabel: string;
  /** EditorState JSON for the active tab; `null` = empty editor. */
  editorJson: string | null;
  canEdit: boolean;
  /** True when no ward-specific template has been saved yet, so the
   *  editor is rendering the system default — surface a small hint
   *  so the bishop knows their first save will customise it. */
  usingDefault: boolean;
  onChange: (json: string) => void;
}

/** Two-column body of the program-templates page: Lexical editor on
 *  the left, sample-data preview on the right. Extracted so the
 *  route stays under the 150-LOC cap. */
export function ProgramTemplatesPanel({
  activeKey,
  description,
  ariaLabel,
  editorJson,
  canEdit,
  usingDefault,
  onChange,
}: Props) {
  const previewVars = useMemo(() => buildSampleVariables(), []);
  return (
    <div className="flex-1 lg:min-h-0 flex flex-col px-4 sm:px-8 pt-4 pb-24 lg:pb-4 lg:overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <p className="font-serif italic text-[14px] text-walnut-2">{description}</p>
        {usingDefault && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brass-soft bg-brass-soft/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
            <span aria-hidden>★</span>
            System default — save to lock in
          </span>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] items-start lg:flex-1 lg:min-h-0">
        <div className="flex flex-col gap-2 lg:h-full lg:min-h-0">
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Editor
          </div>
          <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <ProgramTemplateEditor
              key={activeKey}
              ariaLabel={ariaLabel}
              initialStateJson={editorJson}
              onChange={onChange}
            />
            {!canEdit && (
              <p className="mt-2 font-sans text-[12px] text-walnut-3">
                Read-only — only active members can edit ward templates.
              </p>
            )}
          </div>
        </div>
        <aside className="hidden lg:flex flex-col gap-2 min-w-0 lg:h-full lg:min-h-0">
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium flex items-baseline justify-between">
            <span>Preview · sample data</span>
            <span className="text-walnut-3">
              {activeKey === "congregationProgram" ? "11 × 8.5 in landscape" : "8.5 × 11 in"}
            </span>
          </div>
          {editorJson ? (
            <ScaledProgramPreview variant={activeKey} json={editorJson} variables={previewVars} />
          ) : (
            <div className="rounded-lg border border-border bg-chalk p-5">
              <p className="font-serif italic text-walnut-3">
                Empty template — start typing on the left.
              </p>
            </div>
          )}
        </aside>
      </div>

      <MobileProgramPreviewButton variant={activeKey} json={editorJson} variables={previewVars} />
    </div>
  );
}
