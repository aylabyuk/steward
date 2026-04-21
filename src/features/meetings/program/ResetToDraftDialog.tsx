import { useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface Props {
  open: boolean;
  status: "pending_approval" | "approved" | string;
  liveApprovals: number;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending_approval: "pending approval",
  approved: "approved",
};

export function ResetToDraftDialog({ open, status, liveApprovals, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  useLockBodyScroll(open);
  if (!open) return null;

  async function submit() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  const approvalCopy =
    liveApprovals > 0
      ? `${liveApprovals} existing approval${liveApprovals === 1 ? "" : "s"} will be invalidated.`
      : "The request will be withdrawn and approvers will be notified.";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-walnut/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-[14px] bg-chalk border border-border-strong shadow-elev-3 p-5 animate-[fadePop_180ms_ease-out]">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep mb-1.5">
          Return to draft
        </div>
        <h2 className="font-display text-[20px] font-semibold text-walnut tracking-[-0.01em] m-0 mb-2">
          Edit this {STATUS_LABEL[status] ?? status} program?
        </h2>
        <p className="font-serif italic text-[13.5px] text-walnut-2 mb-4 leading-snug">
          Making changes will return the program to <strong className="not-italic font-semibold text-walnut">draft</strong> status. {approvalCopy} You'll need to request approval again afterward.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
          >
            Keep as {STATUS_LABEL[status] ?? status}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? "Returning…" : "Return to draft & edit"}
          </button>
        </div>
      </div>
    </div>
  );
}
