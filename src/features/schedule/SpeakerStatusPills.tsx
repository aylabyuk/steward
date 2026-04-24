import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SubState } from "@/hooks/_sub";
import { SPEAKER_STATUSES, type Member, type SpeakerStatus, type WithId } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { StatusSource } from "@/lib/types/meeting";

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
 *  to switch back to Planned to send from the app).
 *
 *  When the current status was set by the speaker (via their yes/no
 *  reply) or by another bishopric member, the dialog prepends a
 *  context line so the reviewer understands whose decision they'd be
 *  overriding. */
const BASE_CONFIRM_COPY: Record<
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
  /** Provenance context used to tailor the confirm-dialog body. When
   *  omitted the dialog falls back to the vanilla copy (useful for
   *  callsites where provenance isn't readily available). */
  currentStatusSource?: StatusSource;
  currentStatusSetBy?: string;
  members?: SubState<WithId<Member>[]>;
  currentUserUid?: string | undefined;
}

/** Segmented-control row of speaker statuses. Clicking any non-planned
 *  pill pops a confirm dialog explaining what the status means and
 *  the consequence (no in-app invitation while in that state). */
export function SpeakerStatusPills({
  status,
  onChange,
  currentStatusSource,
  currentStatusSetBy,
  members,
  currentUserUid,
}: Props) {
  const [pending, setPending] = useState<NonPlannedStatus | null>(null);

  function requestChange(next: SpeakerStatus) {
    if (next === status) return;
    if (next === "planned") {
      onChange(next);
      return;
    }
    setPending(next);
  }

  const copy = pending
    ? decorateConfirmCopy(pending, currentStatusSource, currentStatusSetBy, members, currentUserUid)
    : null;

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
      {pending && copy && (
        <ConfirmDialog
          open
          title={copy.title}
          body={copy.body}
          confirmLabel={copy.confirmLabel}
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

function decorateConfirmCopy(
  next: NonPlannedStatus,
  source: StatusSource | undefined,
  setBy: string | undefined,
  members: SubState<WithId<Member>[]> | undefined,
  currentUserUid: string | undefined,
): { title: string; body: string; confirmLabel: string } {
  const base = BASE_CONFIRM_COPY[next];
  const prefix = overridePrefix(source, setBy, members, currentUserUid);
  if (!prefix) return base;
  return { ...base, body: `${prefix} ${base.body}` };
}

function overridePrefix(
  source: StatusSource | undefined,
  setBy: string | undefined,
  members: SubState<WithId<Member>[]> | undefined,
  currentUserUid: string | undefined,
): string | null {
  if (!source) return null;
  if (source === "speaker-response") {
    return "The speaker set this status by replying to the invitation. Overriding it won't change their reply — it only updates the schedule record.";
  }
  // Manual changes: call out the setter if it was someone other than
  // the current signed-in user; stay quiet when self-overriding.
  if (!setBy || setBy === currentUserUid) return null;
  const who = members?.data.find((m) => m.id === setBy)?.data.displayName;
  if (!who) return null;
  return `${who} set the current status. Override with care — there's no automatic notification to them.`;
}
