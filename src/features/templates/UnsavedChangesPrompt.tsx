import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface Props {
  open: boolean;
  saving: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onStay: () => void;
}

/** Three-button "save your changes?" prompt shown when the user
 *  navigates away from the template editor with unsaved edits.
 *  Stay (dismiss / Esc / click-outside) keeps them editing; Discard
 *  drops the draft; Save persists and then exits. */
export function UnsavedChangesPrompt({ open, saving, onSave, onDiscard, onStay }: Props) {
  useLockBodyScroll(open);
  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onStay();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onStay]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onStay();
      }}
    >
      <div className="w-full max-w-sm rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <h2
          id="unsaved-changes-title"
          className="font-display text-[19px] font-semibold text-walnut mb-1.5"
        >
          Save your changes?
        </h2>
        <p className="font-serif text-[14px] text-walnut-2 leading-relaxed mb-5">
          You have unsaved edits. Save them before going back to Templates?
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onStay}
            disabled={saving}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="rounded-md border border-bordeaux bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-bordeaux hover:bg-bordeaux/5 disabled:opacity-60"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="rounded-md border border-walnut bg-walnut px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-walnut-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save and exit"}
          </button>
        </div>
      </div>
    </div>
  );
}
