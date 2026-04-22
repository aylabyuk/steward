interface Props {
  canEdit: boolean;
  busy: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}

/** Save + Reset button pair used by the ward-level letter template
 *  editor. Extracted to keep the page under the 150-LOC ceiling. */
export function TemplateSaveActions({ canEdit, busy, saving, onSave, onReset }: Props) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={!canEdit || busy}
        className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save template"}
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={!canEdit || busy}
        className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
      >
        Reset to defaults
      </button>
    </div>
  );
}
