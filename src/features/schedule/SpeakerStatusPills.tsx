import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

type NonPlannedStatus = Exclude<SpeakerStatus, "planned">;

/** Each non-planned state is a one-way-ish commitment: once the
 *  speaker is marked as invited/confirmed/declined, the Prepare
 *  Invitation flow is gated off. The confirm dialog spells out both
 *  the semantic (what this status means) and the consequence (need
 *  to switch back to Planned to send from the app). */
const CONFIRM_COPY: Record<
  NonPlannedStatus,
  { title: string; body: string; confirmLabel: string }
> = {
  invited: {
    title: "Mark as Invited?",
    body: "Use this when you've already reached out through another channel — email, SMS, or a hallway conversation. You won't be able to send an in-app invitation for this speaker unless you switch them back to Planned.",
    confirmLabel: "Mark as Invited",
  },
  confirmed: {
    title: "Mark as Confirmed?",
    body: "Use this once the speaker has accepted the invitation. You won't be able to send further invitations unless you switch them back to Planned.",
    confirmLabel: "Mark as Confirmed",
  },
  declined: {
    title: "Mark as Declined?",
    body: "We'll keep the speaker on file until you add a replacement. You won't be able to send further invitations unless you switch them back to Planned.",
    confirmLabel: "Mark as Declined",
  },
};

interface Props {
  status: SpeakerStatus;
  onChange: (status: SpeakerStatus) => void;
}

/** Segmented-control row of speaker statuses. Clicking any non-planned
 *  pill pops a confirm dialog explaining what the status means and
 *  the consequence (no in-app invitation while in that state). */
export function SpeakerStatusPills({ status, onChange }: Props) {
  const [pending, setPending] = useState<NonPlannedStatus | null>(null);

  function requestChange(next: SpeakerStatus) {
    if (next === status) return;
    if (next === "planned") {
      onChange(next);
      return;
    }
    setPending(next);
  }

  return (
    <>
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
            onClick={() => requestChange(s)}
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
      {pending && (
        <ConfirmDialog
          open
          title={CONFIRM_COPY[pending].title}
          body={CONFIRM_COPY[pending].body}
          confirmLabel={CONFIRM_COPY[pending].confirmLabel}
          danger={pending === "declined"}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            onChange(pending);
            setPending(null);
          }}
        />
      )}
    </>
  );
}
