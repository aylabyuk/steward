interface Props {
  saving: boolean;
  canReset: boolean;
  onCancel: () => void;
  onReset: () => void;
  onSave: () => void;
}

/** Cancel / Reset / Save footer extracted from
 *  SpeakerLetterOverrideDialog to keep the dialog under the 150-LOC
 *  ceiling. */
export function OverrideDialogFooter({ saving, canReset, onCancel, onReset, onSave }: Props) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
      >
        Cancel
      </button>
      {canReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          {saving ? "Resetting…" : "Reset to ward default"}
        </button>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save override"}
      </button>
    </div>
  );
}
