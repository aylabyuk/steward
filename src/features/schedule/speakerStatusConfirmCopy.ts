import type { SubState } from "@/hooks/_sub";
import type { Member, SpeakerStatus, WithId } from "@/lib/types";
import type { StatusSource } from "@/lib/types/meeting";

type NonPlannedStatus = Exclude<SpeakerStatus, "planned">;
type TerminalStatus = "confirmed" | "declined";

/** Base copy for forward transitions (→ invited/confirmed/declined).
 *  Rollbacks and provenance context are decorated on top. */
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

export interface CopyArgs {
  current: SpeakerStatus;
  next: SpeakerStatus;
  currentStatusSource: StatusSource | undefined;
  currentStatusSetBy: string | undefined;
  members: SubState<WithId<Member>[]> | undefined;
  currentUserUid: string | undefined;
}

export interface ConfirmCopy {
  title: string;
  body: string;
  confirmLabel: string;
  danger: boolean;
}

/** Compose the confirm-dialog copy for a requested status transition.
 *  Three shapes:
 *    - Rollback out of a terminal (confirmed/declined →
 *      planned/invited): heavy-friction copy that names who made the
 *      original commitment and what downstream surfaces lose.
 *    - Forward transition (to invited/confirmed/declined): the
 *      familiar per-target BASE copy, optionally prefixed with a
 *      provenance nudge when someone else set the current status. */
export function computeConfirmCopy(args: CopyArgs): ConfirmCopy {
  const { current, next, currentStatusSource, currentStatusSetBy, members, currentUserUid } = args;
  if (isTerminal(current) && !isTerminal(next)) {
    return rollbackCopy({
      from: current,
      to: next,
      source: currentStatusSource,
      setBy: currentStatusSetBy,
      members,
      currentUserUid,
    });
  }
  const base = BASE_CONFIRM_COPY[next as NonPlannedStatus];
  const prefix = overridePrefix(currentStatusSource, currentStatusSetBy, members, currentUserUid);
  return {
    ...base,
    body: prefix ? `${prefix} ${base.body}` : base.body,
    danger: next === "declined",
  };
}

function rollbackCopy(args: {
  from: TerminalStatus;
  to: "planned" | "invited";
  source: StatusSource | undefined;
  setBy: string | undefined;
  members: SubState<WithId<Member>[]> | undefined;
  currentUserUid: string | undefined;
}): ConfirmCopy {
  const { from, to, source, setBy, members, currentUserUid } = args;
  const whoSet =
    source === "speaker-response" ? "The speaker" : authorshipHint(setBy, members, currentUserUid);
  const verb = from === "confirmed" ? "confirmation" : "decline";
  const destLabel = to === "planned" ? "Planned" : "Invited";
  const toLine =
    to === "planned"
      ? "The card reverts to Planned and you can send a fresh invitation or remove them without further friction."
      : "The card reverts to Invited — the commitment log still carries the history but this speaker is no longer locked in.";
  const subject = whoSet ?? "This";
  return {
    title: from === "confirmed" ? "Clear confirmed status?" : "Undo decline?",
    body: `${subject} set the ${verb}. Rolling back to ${destLabel} clears that commitment from the card. The history stays in the audit log, but downstream surfaces (chat banner, schedule pill) will stop reflecting it. ${toLine}`,
    confirmLabel: from === "confirmed" ? "Clear confirmation" : "Undo decline",
    danger: true,
  };
}

function authorshipHint(
  setBy: string | undefined,
  members: SubState<WithId<Member>[]> | undefined,
  currentUserUid: string | undefined,
): string | null {
  if (!setBy) return null;
  if (setBy === currentUserUid) return "You";
  return members?.data.find((m) => m.id === setBy)?.data.displayName ?? null;
}

function isTerminal(s: SpeakerStatus): s is TerminalStatus {
  return s === "confirmed" || s === "declined";
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
  if (!setBy || setBy === currentUserUid) return null;
  const who = members?.data.find((m) => m.id === setBy)?.data.displayName;
  if (!who) return null;
  return `${who} set the current status. Override with care — there's no automatic notification to them.`;
}
