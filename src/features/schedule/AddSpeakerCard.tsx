import { cn } from "@/lib/cn";

interface Props {
  onClick: () => void;
  /** When true, the card renders in a greyed-out limit-reached state
   *  and clicking is a no-op. */
  disabled: boolean;
  /** Cap shown in the limit-reached message (e.g. "4 speakers per Sunday"). */
  max: number;
}

/** Tile that sits alongside `<SpeakerEditCard>`s in the Assign
 *  Speakers grid. Clicking adds a blank speaker draft. When the cap
 *  is reached the tile stays in the grid for positional stability but
 *  renders greyed-out with an explanation so the bishop knows why
 *  Add doesn't work rather than the affordance just vanishing. */
export function AddSpeakerCard({ onClick, disabled, max }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={disabled ? `Limit reached — ${max} speakers per Sunday` : "Add speaker"}
      className={cn(
        "rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 p-6 min-h-[180px] transition-colors focus:outline-none focus:ring-2 focus:ring-bordeaux/30",
        disabled
          ? "border-border bg-parchment-2/30 cursor-not-allowed"
          : "border-border-strong bg-chalk hover:border-bordeaux hover:bg-parchment-2",
      )}
    >
      <PlusIcon disabled={disabled} />
      <span
        className={cn(
          "font-sans text-[13.5px] font-semibold",
          disabled ? "text-walnut-3" : "text-walnut",
        )}
      >
        {disabled ? "Limit reached" : "Add speaker"}
      </span>
      {disabled && (
        <span className="font-serif italic text-[11.5px] text-walnut-3 text-center px-2">
          Max {max} speakers per Sunday.
        </span>
      )}
    </button>
  );
}

function PlusIcon({ disabled }: { disabled: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={disabled ? "text-walnut-3/60" : "text-walnut-2"}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
