import { Save } from "lucide-react";

interface Props {
  /** True when the editor state differs from the last saved/initial
   *  snapshot. Drives the disabled state. */
  dirty: boolean;
  busy: boolean;
  onSave: () => void;
}

const ICON_SIZE = 14;
const ICON_STROKE = 1.75;

/** Save the current letter as a per-speaker override without sending.
 *  Disabled when there's nothing to save (so the bishop never wonders
 *  "did anything happen?" after clicking) or while another action is
 *  in flight. Same neutral chrome as Send Email so the eye groups
 *  Save / Send Email / Send SMS as the three terminal actions. */
export function ToolbarSaveButton({ dirty, busy, onSave }: Props) {
  const disabled = !dirty || busy;
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled}
      aria-label={dirty ? "Save changes" : "No changes to save"}
      title={dirty ? "Save changes" : "No changes to save"}
      className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-chalk px-3.5 sm:px-4 h-9 sm:h-10 text-walnut font-sans text-[13px] font-semibold tracking-[0.01em] transition-colors hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-chalk"
    >
      <Save size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      <span>Save</span>
    </button>
  );
}
