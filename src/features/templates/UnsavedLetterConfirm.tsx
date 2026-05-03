import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface Props {
  open: boolean;
  /** True while the Save & exit path is in flight. Disables every
   *  button so a double-click can't queue two saves. */
  busy: boolean;
  /** Surface a save failure inline so the bishop sees the reason
   *  instead of the modal silently staying open. */
  error: string | null;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onSaveAndExit: () => void;
}

/** Three-button exit guard for the Prepare Invitation editor.
 *  Save & exit / Discard / Cancel — explicit choices so the bishop
 *  always knows what happens to in-flight edits. Modeled on the
 *  assign-slot DiscardChangesConfirm but adds the Save path the
 *  letter editor needs.
 *
 *  Esc keeps editing (capture-phase + `stopImmediatePropagation` so
 *  the page's exit-guard Esc handler doesn't reopen this same
 *  modal). Backdrop click also keeps editing — accidental dismissals
 *  shouldn't navigate away. */
export function UnsavedLetterConfirm({
  open,
  busy,
  error,
  onKeepEditing,
  onDiscard,
  onSaveAndExit,
}: Props) {
  useLockBodyScroll(open);
  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (!busy) onKeepEditing();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, busy, onKeepEditing]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-letter-confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onKeepEditing();
      }}
    >
      <div className="w-full max-w-sm rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <h2
          id="unsaved-letter-confirm-title"
          className="font-display text-[19px] font-semibold text-walnut mb-1.5"
        >
          Unsaved changes
        </h2>
        <p className="font-serif text-[14px] text-walnut-2 leading-relaxed mb-5">
          You have unsaved edits to this letter. Save them before leaving so the next download or
          send uses your latest copy?
        </p>
        {error && (
          <p className="font-sans text-[12.5px] text-bordeaux mb-4" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onKeepEditing}
            disabled={busy}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={busy}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-bordeaux hover:bg-bordeaux/5 disabled:opacity-60"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSaveAndExit}
            disabled={busy}
            className="rounded-md border border-walnut bg-walnut px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-walnut-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Saving…" : "Save & exit"}
          </button>
        </div>
      </div>
    </div>
  );
}
