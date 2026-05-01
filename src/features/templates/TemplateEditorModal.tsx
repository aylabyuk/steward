import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { EditorSection } from "./MarkdownEditor";
import { TemplatePreviewProviders } from "./MessageTemplateCardDesktop";
import { TemplateVariableList, type TemplateVariableDoc } from "./TemplateVariableList";
import { UnsavedChangesPrompt } from "./UnsavedChangesPrompt";

interface Props {
  open: boolean;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  variables: readonly TemplateVariableDoc[];
  sampleVars: Readonly<Record<string, string>>;
  editorLabel: string;
  canEdit: boolean;
  saving: boolean;
  error: string | null;
  body: string;
  defaultBody: string;
  /** True when `body` has diverged from the snapshot the modal opened
   *  with — drives the "save your changes?" prompt on back-tap. */
  dirty: boolean;
  onChange: (next: string) => void;
  onSave: () => void | Promise<void>;
  /** Discard path: reverts `body` to the pre-edit snapshot and closes
   *  the modal. Called for both the back-button-when-clean and the
   *  "Discard" choice in the unsaved-changes prompt. */
  onCancel: () => void;
  onReset: () => void;
}

/** Fullscreen mobile edit modal for a template section. Top bar holds
 *  all the actions: ← Templates (left, with dirty-check prompt),
 *  Reset icon + Save (right). Eyebrow / title / description sit below
 *  the bar; the variable list + editor fill the rest of the viewport. */
export function TemplateEditorModal({
  open,
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
  dirty,
  onChange,
  onSave,
  onCancel,
  onReset,
}: Props): React.ReactElement | null {
  const [promptOpen, setPromptOpen] = useState(false);
  useLockBodyScroll(open);

  function requestExit() {
    if (dirty) setPromptOpen(true);
    else onCancel();
  }

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      requestExit();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-chalk flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-editor-modal-title"
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={requestExit}
          disabled={saving}
          className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut px-2 py-1.5 disabled:opacity-60"
        >
          ← Templates
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Reset to default"
            onClick={onReset}
            disabled={!canEdit || saving || body === defaultBody}
            className="grid place-items-center w-9 h-9 rounded-md border border-border-strong bg-chalk text-walnut-2 hover:bg-parchment-2 hover:text-walnut disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={!canEdit || saving || !dirty}
            className="font-sans text-[13px] font-semibold px-3.5 h-9 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <header className="px-5 pt-4 pb-3 border-b border-border">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
          {eyebrow}
        </div>
        <h2
          id="template-editor-modal-title"
          className="font-display text-[20px] font-semibold text-walnut mb-1.5"
        >
          {title}
        </h2>
        <div className="font-serif italic text-[13px] text-walnut-2 leading-snug">
          {description}
        </div>
      </header>
      <div className="px-5 py-4 flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
        <TemplateVariableList variables={variables} />
        <TemplatePreviewProviders variables={variables} sampleVars={sampleVars}>
          <EditorSection
            label={editorLabel}
            initialMarkdown={body}
            onChange={onChange}
            disabled={!canEdit || saving}
          />
        </TemplatePreviewProviders>
        {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
      </div>
      <UnsavedChangesPrompt
        open={promptOpen}
        saving={saving}
        onSave={async () => {
          await onSave();
          setPromptOpen(false);
        }}
        onDiscard={() => {
          setPromptOpen(false);
          onCancel();
        }}
        onStay={() => setPromptOpen(false)}
      />
    </div>
  );
}
