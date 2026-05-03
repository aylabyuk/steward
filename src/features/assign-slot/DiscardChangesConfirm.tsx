import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface Props {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/** Two-button "discard your changes?" prompt fired when the user
 *  cancels the per-row Assign + Invite form with unsaved edits. The
 *  templates editor has a richer 3-button variant (Save and exit /
 *  Discard / Keep editing); here there are two save actions
 *  (Save as Planned, Continue), so an in-prompt save is ambiguous. */
export function DiscardChangesConfirm({ open, onKeepEditing, onDiscard }: Props) {
  useLockBodyScroll(open);
  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onKeepEditing();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onKeepEditing]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-changes-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onKeepEditing();
      }}
    >
      <div className="w-full max-w-sm rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <h2
          id="discard-changes-title"
          className="font-display text-[19px] font-semibold text-walnut mb-1.5"
        >
          Discard your changes?
        </h2>
        <p className="font-serif text-[14px] text-walnut-2 leading-relaxed mb-5">
          You have unsaved edits. Closing now will lose them.
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onKeepEditing}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
