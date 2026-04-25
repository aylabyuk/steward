import { EditorSection } from "./MarkdownEditor";
import { TemplateVariableList, type TemplateVariableDoc } from "./TemplateVariableList";

const SMS_SEGMENT = 160;

interface Props {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  variables: readonly TemplateVariableDoc[];
  editorLabel: string;
  canEdit: boolean;
  saving: boolean;
  error: string | null;
  body: string;
  defaultBody: string;
  previewNode: React.ReactElement;
  onBodyChange: (next: string) => void;
  onSave: () => void | Promise<void>;
  onReset: () => void;
  className?: string;
}

/** Desktop (`≥sm`) card body shared by every template section on
 *  /settings/templates. Takes a pre-rendered `previewNode` so each
 *  section can supply its own preview layout (plain text, with SMS
 *  char counter, or a custom renderer). Split from the orchestrator
 *  so the combined section file stays under the 150-LOC cap. */
export function MessageTemplateCardDesktop({
  sectionId,
  eyebrow,
  title,
  description,
  variables,
  editorLabel,
  canEdit,
  saving,
  error,
  body,
  defaultBody,
  previewNode,
  onBodyChange,
  onSave,
  onReset,
  className,
}: Props): React.ReactElement {
  const rootClass = ["bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24", className]
    .filter(Boolean)
    .join(" ");
  return (
    <section id={sectionId} className={rootClass}>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        {eyebrow}
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">{title}</h2>
      <div className="font-serif italic text-[14px] text-walnut-2 mb-4">{description}</div>

      <TemplateVariableList variables={variables} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mt-4">
        <div className="flex flex-col gap-3">
          <EditorSection
            label={editorLabel}
            initialMarkdown={body}
            onChange={onBodyChange}
            disabled={!canEdit}
          />
          {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
        </div>
        {previewNode}
      </div>

      <div className="mt-4 pt-4 border-t border-border lg:border-t-0 lg:pt-0 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={!canEdit || saving || body === defaultBody}
          className="font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Reset to default
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!canEdit || saving}
          className="font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : "Save template"}
        </button>
      </div>
    </section>
  );
}

export function PreviewPane({
  preview,
  kind,
}: {
  preview: string;
  kind: "sms" | "email";
}): React.ReactElement {
  const segments = kind === "sms" ? Math.max(1, Math.ceil(preview.length / SMS_SEGMENT)) : null;
  return (
    <aside className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
        <span>Preview — sample data</span>
        {kind === "sms" && (
          <span>
            {preview.length} chars · {segments === 1 ? "1 segment" : `${segments} segments`}
          </span>
        )}
      </div>
      <pre className="rounded-md border border-border bg-parchment-2/60 p-4 font-serif text-[13px] text-walnut-2 leading-relaxed whitespace-pre-wrap break-words min-h-24">
        {preview}
      </pre>
    </aside>
  );
}
