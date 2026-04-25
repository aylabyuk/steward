import type { SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RemoveIcon } from "./SpeakerInviteIcons";

interface Props {
  index: number;
  status: SpeakerStatus;
  /** Null hides the remove button — used by the step-2 locked card,
   *  where editing (including removal) is deferred to step 1. */
  onRemove: (() => void) | null;
}

/** The top row of a SpeakerEditCard: "Speaker · 01" eyebrow, the
 *  current status pill (always visible so a bishop scanning the
 *  card grid can see who's still pending an invitation), and the
 *  remove button. */
export function SpeakerCardHeader({ index, status, onRemove }: Props) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium">
        Speaker · {String(index + 1).padStart(2, "0")}
      </span>
      <StatusPill status={status} className="ml-auto" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove speaker"
          className="text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 rounded p-1 transition-colors"
        >
          <RemoveIcon />
        </button>
      )}
    </div>
  );
}

const STATE_CLS: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 text-walnut-2 border-border",
  invited: "bg-brass-soft/40 text-brass-deep border-brass-soft",
  confirmed: "bg-success-soft text-success border-success-soft",
  declined: "bg-danger-soft text-bordeaux border-danger-soft",
};

function StatusPill({ status, className }: { status: SpeakerStatus; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border whitespace-nowrap",
        STATE_CLS[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
