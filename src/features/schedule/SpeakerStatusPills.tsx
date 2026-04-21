import { SPEAKER_STATUSES, type SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATE_LABELS: Record<SpeakerStatus, string> = {
  planned: "Planned",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
};

const STATE_ACTIVE: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 text-walnut",
  invited: "bg-brass-soft text-walnut",
  confirmed: "bg-success-soft text-success",
  declined: "bg-danger-soft text-bordeaux",
};

interface Props {
  status: SpeakerStatus;
  onChange: (status: SpeakerStatus) => void;
}

/** Segmented-control row of speaker statuses. Extracted from
 *  SpeakerEditCard so the card fits under the 150-LOC ceiling. */
export function SpeakerStatusPills({ status, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Speaker state"
      className="grid grid-cols-4 border border-border-strong rounded-md overflow-hidden bg-chalk mb-2.5"
    >
      {SPEAKER_STATUSES.map((s, i) => (
        <button
          key={s}
          role="radio"
          aria-checked={status === s}
          onClick={() => onChange(s)}
          className={cn(
            "font-mono text-[9.5px] uppercase tracking-[0.06em] py-2 text-walnut-2 hover:bg-parchment-2 transition-colors",
            i < SPEAKER_STATUSES.length - 1 && "border-r border-border",
            status === s && STATE_ACTIVE[s],
          )}
        >
          {STATE_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
