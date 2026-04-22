import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  /** When true, confirm button uses the bordeaux danger style.
   *  Otherwise it's walnut/neutral. */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small "are you sure?" modal — yes/no pair of buttons with a short
 *  explanation. Use for actions that would silently change state
 *  (status flips, destructive resets) so an accidental tap can't
 *  cost the user a re-send. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  useLockBodyScroll(open);
  // Esc cancels. Registered in the capture phase with stopImmediatePropagation
  // so a parent modal listening on `document` (e.g. AssignDialog) doesn't
  // also receive the event and close itself out from under us.
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
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <h2
          id="confirm-dialog-title"
          className="font-display text-[19px] font-semibold text-walnut mb-1.5"
        >
          {title}
        </h2>
        <p className="font-serif text-[14px] text-walnut-2 leading-relaxed mb-5">{body}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={
              danger
                ? "rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
                : "rounded-md border border-walnut bg-walnut px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-walnut-2 disabled:opacity-60 disabled:cursor-not-allowed"
            }
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
