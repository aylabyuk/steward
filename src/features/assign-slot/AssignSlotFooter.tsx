interface Props {
  canSubmit: boolean;
  busy: boolean;
  showDelete: boolean;
  /** When false, the Save / Continue buttons are hidden entirely
   *  (used by locked-state forms — the only meaningful action there
   *  is Remove / Delete). */
  showSaveActions?: boolean;
  /** Verb on the destructive button. "Delete" for speakers (slot
   *  goes away), "Remove" for prayer-givers (slot stays, just
   *  unassigned). */
  deleteLabel?: string;
  onDelete: () => void;
  onContinue: () => void;
  onSavePlanned: () => void;
}

/** Action row for the per-row Assign + Invite form. Continue routes
 *  through to the Prepare Invitation page (letter + send CTAs); Save
 *  as Planned commits the slot and returns to the schedule. Delete
 *  is shown only when editing an existing assignment. */
export function AssignSlotFooter({
  canSubmit,
  busy,
  showDelete,
  showSaveActions = true,
  deleteLabel = "Delete",
  onDelete,
  onContinue,
  onSavePlanned,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {showDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-chalk px-3 py-2 font-sans text-[13px] font-semibold text-bordeaux hover:bg-bordeaux/5 hover:border-bordeaux disabled:opacity-60"
        >
          {deleteLabel}
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      {showSaveActions && (
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={onSavePlanned}
            disabled={!canSubmit}
            className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save as Planned"}
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canSubmit}
            className="rounded-md border border-bordeaux-deep bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-parchment hover:bg-bordeaux-deep disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
