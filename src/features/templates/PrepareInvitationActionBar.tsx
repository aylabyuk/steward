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

/** Top-of-dialog action bar for PrepareInvitationDialog. Stays fixed
 *  at the top of the modal so the four terminal actions (Cancel /
 *  Mark invited / Print / Send) and the "save as override" toggle
 *  don't jump around as the tab content below scrolls. */
export function PrepareInvitationActionBar({
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
    <div className="flex flex-col gap-1.5 items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 font-sans text-[12px] text-walnut-2 select-none mr-1">
          <input
            type="checkbox"
            checked={saveAsOverride}
            onChange={(e) => setSaveAsOverride(e.target.checked)}
            disabled={busy}
            className="accent-bordeaux"
          />
          Save as per-speaker override
        </label>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onMarkInvited}
          disabled={busy}
          className="rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Mark invited only
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={busy}
          className="rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Print letter
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={busy || !canSend}
          className="rounded-md border border-bordeaux bg-bordeaux px-3 py-1.5 font-sans text-[12.5px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Working…" : "Send email"}
        </button>
      </div>
      {canSendReason && (
        <span className="font-serif italic text-[11.5px] text-walnut-3">{canSendReason}</span>
      )}
    </div>
  );
}
