/** Two step-specific footer rows for the Assign Speakers modal. The
 *  edit step has Cancel + Save; the invite step has Back + Done. Each
 *  is dumb — just wiring buttons to callbacks the parent already owns. */

export function EditFooter({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <button
        onClick={onCancel}
        className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </>
  );
}

export function InviteFooter({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  return (
    <>
      <button
        onClick={onBack}
        className="mr-auto font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
      >
        ← Back to edit
      </button>
      <button
        onClick={onDone}
        className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors"
      >
        Done
      </button>
    </>
  );
}
