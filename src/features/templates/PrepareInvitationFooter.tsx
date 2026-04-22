interface Props {
  saveAsOverride: boolean;
  setSaveAsOverride: (v: boolean) => void;
  busy: boolean;
  canSend: boolean; // email is present + valid + speaker persisted
  canSendReason: string | null; // inline hint when !canSend
  onCancel: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
  onSend: () => void;
}

/** Bottom band of PrepareInvitationDialog: the "save as override"
 *  checkbox plus the four terminal actions (Cancel / Mark invited /
 *  Print / Send email). Extracted so the main dialog stays under the
 *  LOC ceiling. */
export function PrepareInvitationFooter({
  saveAsOverride,
  setSaveAsOverride,
  busy,
  canSend,
  canSendReason,
  onCancel,
  onMarkInvited,
  onPrint,
  onSend,
}: Props) {
  return (
    <div className="mt-5 flex flex-col gap-3">
      <label className="flex items-center gap-2 font-sans text-[12.5px] text-walnut-2 select-none">
        <input
          type="checkbox"
          checked={saveAsOverride}
          onChange={(e) => setSaveAsOverride(e.target.checked)}
          disabled={busy}
          className="accent-bordeaux"
        />
        Save my edits as a per-speaker override (persists for re-sends)
      </label>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canSendReason && (
          <span className="mr-auto font-serif italic text-[12px] text-walnut-3">
            {canSendReason}
          </span>
        )}
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
          onClick={onMarkInvited}
          disabled={busy}
          className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Mark invited only
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={busy}
          className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Print letter
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={busy || !canSend}
          className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Working…" : "Send email"}
        </button>
      </div>
    </div>
  );
}
