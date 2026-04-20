import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}

export function CancelDialog({ open, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  async function submit() {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Cancel this meeting?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter a reason. Approvals + content are preserved; you can uncancel later.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          placeholder="Reason"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
          >
            Keep meeting
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !reason.trim()}
            className="rounded-md bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Cancel meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
