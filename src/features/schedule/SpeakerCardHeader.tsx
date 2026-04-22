import { RemoveIcon } from "./SpeakerInviteIcons";

interface Props {
  index: number;
  onRemove: () => void;
}

/** The top row of a SpeakerEditCard: "Speaker · 01" label and the
 *  remove button. Letter/email editing used to live here via an "Edit
 *  letter" button; it's now reached through "Prepare invitation" on
 *  the planned-status action strip instead. */
export function SpeakerCardHeader({ index, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium">
        Speaker · {String(index + 1).padStart(2, "0")}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove speaker"
        className="ml-auto text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 rounded p-1 transition-colors"
      >
        <RemoveIcon />
      </button>
    </div>
  );
}
