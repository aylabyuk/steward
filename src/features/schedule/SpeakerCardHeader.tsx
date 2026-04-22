import { cn } from "@/lib/cn";
import { RemoveIcon } from "./SpeakerInviteIcons";

interface Props {
  index: number;
  canEditLetter: boolean;
  onEditLetter: () => void;
  onRemove: () => void;
}

/** The top row of a SpeakerEditCard: "Speaker · 01" label, optional
 *  "Edit letter" action, and the remove button. Extracted to keep the
 *  card under the 150-LOC ceiling. */
export function SpeakerCardHeader({ index, canEditLetter, onEditLetter, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium">
        Speaker · {String(index + 1).padStart(2, "0")}
      </span>
      {canEditLetter && (
        <button
          type="button"
          onClick={onEditLetter}
          className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:text-bordeaux px-2 py-1 rounded hover:bg-parchment-2 transition-colors"
        >
          Edit letter
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove speaker"
        className={cn(
          "text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 rounded p-1 transition-colors",
          !canEditLetter && "ml-auto",
        )}
      >
        <RemoveIcon />
      </button>
    </div>
  );
}
