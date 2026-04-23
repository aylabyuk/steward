import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { EditorSection } from "./SpeakerLetterEditor";
import { TemplateVariableList, type TemplateVariableDoc } from "./TemplateVariableList";

interface Props {
  open: boolean;
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
  onChange: (next: string) => void;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  onReset: () => void;
}

/** Fullscreen mobile edit modal for a template section. Takes over the
 *  whole viewport so the editor has room to breathe; shows the same
 *  description + variable list authors need to reference while writing.
 *  Cancel reverts the draft (parent owns body state); Save writes via
 *  Firestore and closes. No preview — the accordion behind the modal
 *  already shows it. */
export function TemplateEditorModal({
  open,
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
  onChange,
  onSave,
  onCancel,
  onReset,
}: Props): React.ReactElement | null {
  useLockBodyScroll(open);
  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onCancel();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-chalk flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-editor-modal-title"
    >
      <header className="px-5 pt-5 pb-4 border-b border-border">
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
        <EditorSection
          label={editorLabel}
          initialMarkdown={body}
          onChange={onChange}
          disabled={!canEdit || saving}
        />
        {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
      </div>
      <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={!canEdit || saving || body === defaultBody}
          className="font-sans text-[13px] font-semibold px-3 py-2 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={!canEdit || saving}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
