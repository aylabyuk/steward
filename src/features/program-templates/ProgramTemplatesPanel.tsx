import { useMemo } from "react";
import type { ProgramTemplateKey } from "@/lib/types";
import { ProgramTemplateEditor } from "./ProgramTemplateEditor";
import { buildSampleVariables, renderProgramState } from "./programTemplateRender";

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
    <div className="flex-1 px-5 sm:px-8 py-5 pb-24 max-w-7xl w-full mx-auto">
      <p className="font-serif italic text-[14px] text-walnut-2 mb-4">{description}</p>
      {usingDefault && (
        <div className="mb-4 rounded-md border border-brass-soft bg-brass-soft/30 px-3 py-2 flex items-start gap-2">
          <span
            aria-hidden
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-semibold mt-0.5"
          >
            ★
          </span>
          <p className="font-sans text-[12.5px] text-walnut-2 leading-relaxed">
            Showing the system default. Save to lock it in for your ward — you can edit it any time
            after.
          </p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Editor
          </div>
          <ProgramTemplateEditor
            key={activeKey}
            ariaLabel={ariaLabel}
            initialStateJson={editorJson}
            onChange={onChange}
          />
          {!canEdit && (
            <p className="font-sans text-[12px] text-walnut-3">
              Read-only — only active members can edit ward templates.
            </p>
          )}
        </div>
        <aside className="flex flex-col gap-2 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Preview · sample data
          </div>
          <div className="rounded-lg border border-border bg-chalk p-5 prose prose-sm max-w-none font-serif text-walnut">
            {editorJson ? (
              renderProgramState(editorJson, previewVars)
            ) : (
              <p className="font-serif italic text-walnut-3">
                Empty template — start typing on the left.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
