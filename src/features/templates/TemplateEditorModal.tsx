import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { EditorSection } from "./SpeakerLetterEditor";

interface Props {
  open: boolean;
  eyebrow: string;
  title: string;
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

/** Mobile edit modal for a template section. Reuses EditorSection so
 *  the authoring experience matches desktop; Cancel reverts the draft
 *  (the parent handles body state); Save writes through Firestore then
 *  closes. No preview inside — the accordion behind the modal shows
 *  it, and mobile viewports can't show both at once anyway. */
export function TemplateEditorModal({
  open,
  eyebrow,
  title,
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
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-editor-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div className="w-full max-w-xl max-h-[calc(100vh-4rem)] flex flex-col rounded-[14px] border border-border-strong bg-chalk shadow-elev-3">
        <div className="px-5 pt-5 pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
            {eyebrow}
          </div>
          <h2
            id="template-editor-modal-title"
            className="font-display text-[19px] font-semibold text-walnut"
          >
            {title}
          </h2>
        </div>
        <div className="px-5 pb-3 flex-1 min-h-0 overflow-y-auto">
          <EditorSection
            label={editorLabel}
            initialMarkdown={body}
            onChange={onChange}
            disabled={!canEdit || saving}
          />
          {error && <p className="font-sans text-[12.5px] text-bordeaux mt-2">{error}</p>}
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!canEdit || saving || body === defaultBody}
            className="font-sans text-[13px] font-semibold px-3 py-2 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset to default
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
    </div>
  );
}
