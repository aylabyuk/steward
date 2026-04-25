import { useEffect, useState } from "react";
import type { SpeakerStatus } from "@/lib/types";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface Props {
  open: boolean;
  speakerName: string;
  speakerStatus: SpeakerStatus;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const STATUS_WARNING: Partial<Record<SpeakerStatus, string>> = {
  invited:
    "This speaker has already been invited. Deleting will not retract the invitation already sent — you'll need to message them directly.",
  confirmed:
    "This speaker has already CONFIRMED for this Sunday. Deleting will leave them expecting to speak unless you reach out separately.",
};

export function DeleteSpeakerConfirm({
  open,
  speakerName,
  speakerStatus,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState("");
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

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

  const target = speakerName.trim();
  const matches = typed.trim().toLowerCase() === target.toLowerCase() && target.length > 0;
  const warning = STATUS_WARNING[speakerStatus];

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-speaker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-3">
        <h2 id="delete-speaker-title" className="font-display text-[19px] font-semibold text-walnut mb-1.5">
          Delete {speakerName}?
        </h2>
        <p className="font-serif text-[14px] text-walnut-2 leading-relaxed mb-4">
          This removes the speaker from this Sunday's plan. To confirm, type{" "}
          <strong className="text-walnut font-semibold">{speakerName}</strong> below.
        </p>

        {warning && (
          <div className="mb-4 rounded-md border border-bordeaux/40 bg-bordeaux/5 px-3 py-2 flex gap-2 items-start">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bordeaux-deep font-semibold mt-0.5">
              !
            </span>
            <p className="font-sans text-[12.5px] text-bordeaux-deep leading-relaxed">{warning}</p>
          </div>
        )}

        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={speakerName}
          className="font-sans text-[14px] px-3 py-2.5 bg-chalk border border-border-strong rounded-md text-walnut w-full focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 mb-5"
        />

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
            disabled={!matches || busy}
            className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Deleting…" : "Delete speaker"}
          </button>
        </div>
      </div>
    </div>
  );
}
