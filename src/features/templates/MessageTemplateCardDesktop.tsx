import { LetterRenderContextProvider } from "@/features/page-editor/utils/letterRenderContext";
import {
  type VariableMeta,
  VariableRegistryProvider,
} from "@/features/page-editor/utils/variableRegistry";
import { EditorSection } from "./MarkdownEditor";
import { TemplateVariableList, type TemplateVariableDoc } from "./TemplateVariableList";

interface Props {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  variables: readonly TemplateVariableDoc[];
  /** Sample bag used to render `{{token}}` chips inline so the editor
   *  reads as the message the recipient will see. */
  sampleVars: Readonly<Record<string, string>>;
  editorLabel: string;
  canEdit: boolean;
  saving: boolean;
  error: string | null;
  body: string;
  defaultBody: string;
  onBodyChange: (next: string) => void;
  onSave: () => void | Promise<void>;
  onReset: () => void;
  className?: string;
}

/** Desktop (`≥sm`) card body shared by every template section on
 *  /settings/templates. Single-column: variables list at top, editor
 *  in the middle (chips render inline sample values so the editor
 *  doubles as the preview), Reset / Save at the bottom. */
export function MessageTemplateCardDesktop({
  sectionId,
  eyebrow,
  title,
  description,
  variables,
  sampleVars,
  editorLabel,
  canEdit,
  saving,
  error,
  body,
  defaultBody,
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

      <div className="flex flex-col gap-3 mt-4">
        <TemplatePreviewProviders variables={variables} sampleVars={sampleVars}>
          <EditorSection
            label={editorLabel}
            initialMarkdown={body}
            onChange={onBodyChange}
            disabled={!canEdit}
          />
        </TemplatePreviewProviders>
        {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
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

interface ProvidersProps {
  variables: readonly TemplateVariableDoc[];
  sampleVars: Readonly<Record<string, string>>;
  children: React.ReactNode;
}

/** Wraps a message-template editor so `{{token}}` chips inside it
 *  render their sample values inline (instead of bare tokens). Reused
 *  by both the desktop card and the mobile fullscreen modal. */
export function TemplatePreviewProviders({ variables, sampleVars, children }: ProvidersProps) {
  const meta: VariableMeta[] = variables.map((v) => ({
    token: v.name,
    label: v.name,
    sample: sampleVars[v.name] ?? "",
  }));
  return (
    <VariableRegistryProvider variables={meta}>
      <LetterRenderContextProvider assignedDate={null} vars={sampleVars} liveValues={false}>
        {children}
      </LetterRenderContextProvider>
    </VariableRegistryProvider>
  );
}
