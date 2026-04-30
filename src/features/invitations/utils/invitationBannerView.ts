import type { Speaker, SpeakerInvitation } from "@/lib/types";
import { assigneeNoun } from "./slotKindCopy";

export interface BannerView {
  message: string;
  bg: string;
  text: string;
  showApply: boolean;
  applyLabel: string;
}

/** Derive the primary state message + colour scheme rendered at the
 *  top of the bishop-side invitation chat dialog. Priority order:
 *
 *    1. Final statuses (confirmed / declined) win over everything —
 *       once the bishopric marks the status, that's the source of
 *       truth regardless of what the invitation response says.
 *    2. Response overlays (speaker replied yes/no but bishopric
 *       hasn't acknowledged) surface the Apply affordance.
 *    3. Expiry falls through when there's no response and the status
 *       is still invited/planned.
 *    4. Plain "waiting for reply" / "not yet invited" fallback.
 *
 *  All copy is kind-aware: prayer-giver chats read "Prayer giver…"
 *  while speaker chats keep the original "Speaker…" wording. */
export function deriveBannerView(speaker: Speaker, invitation: SpeakerInvitation): BannerView {
  const expired = isExpired(invitation.expiresAt);
  const response = invitation.response;
  const status = speaker.status ?? "planned";
  const noun = assigneeNoun(invitation.kind);

  if (status === "confirmed") {
    return {
      message: `${noun} has accepted the assignment`,
      bg: "bg-gradient-to-br from-success-soft to-success-soft/60",
      text: "text-success",
      showApply: false,
      applyLabel: "",
    };
  }
  if (status === "declined") {
    return {
      message: `${noun} declined the invitation`,
      bg: "bg-gradient-to-br from-danger-soft to-danger-soft/60",
      text: "text-bordeaux",
      showApply: false,
      applyLabel: "",
    };
  }
  if (response?.answer === "yes" && !response.acknowledgedAt) {
    return {
      message: `${noun} has accepted the assignment, but you need to confirm first.`,
      bg: "bg-gradient-to-br from-warning-soft to-warning-soft/60",
      text: "text-brass-deep",
      showApply: true,
      applyLabel: "Confirm",
    };
  }
  if (response?.answer === "no" && !response.acknowledgedAt) {
    return {
      message: `${noun} has declined. Acknowledge to update the schedule.`,
      bg: "bg-gradient-to-br from-danger-soft to-danger-soft/60",
      text: "text-bordeaux",
      showApply: true,
      applyLabel: "Acknowledge",
    };
  }
  if (expired) {
    return {
      message: `Invitation expired before the ${noun.toLowerCase()} replied.`,
      bg: "bg-gradient-to-br from-parchment-2 to-parchment",
      text: "text-walnut-2",
      showApply: false,
      applyLabel: "",
    };
  }
  if (status === "invited") {
    return {
      message: `Waiting for ${noun.toLowerCase()}'s reply.`,
      bg: "bg-gradient-to-br from-warning-soft to-warning-soft/60",
      text: "text-brass-deep",
      showApply: false,
      applyLabel: "",
    };
  }
  return {
    message: "Planned — invitation not yet sent.",
    bg: "bg-parchment-2",
    text: "text-walnut-2",
    showApply: false,
    applyLabel: "",
  };
}

interface FirestoreTimestampLike {
  toDate: () => Date;
}

function isExpired(value: unknown): boolean {
  const ts = value as Partial<FirestoreTimestampLike> | undefined;
  if (!ts || typeof ts.toDate !== "function") return false;
  return ts.toDate().getTime() < Date.now();
}

/** Format the speaker's last-seen heartbeat for the chat read-receipt
 *  line. Buckets: live (< 2 min, 1× heartbeat cadence of slack),
 *  minutes-ago (< 1 h), same-day clock time, other-day short date.
 *  Kind-aware so prayer chats read "Prayer giver last seen". */
export function formatLastSeen(
  value: unknown,
  kind: SpeakerInvitation["kind"] = "speaker",
): string | null {
  const ts = value as Partial<FirestoreTimestampLike> | undefined;
  if (!ts || typeof ts.toDate !== "function") return null;
  const seenAt = ts.toDate();
  const ageMs = Date.now() - seenAt.getTime();
  const noun = assigneeNoun(kind);
  if (ageMs < 2 * 60_000) return `${noun} is viewing the chat now`;
  if (ageMs < 60 * 60_000) {
    const mins = Math.round(ageMs / 60_000);
    return `${noun} last seen · ${mins} min ago`;
  }
  const sameDay = new Date().toDateString() === seenAt.toDateString();
  if (sameDay) {
    return `${noun} last seen · ${seenAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  return `${noun} last seen · ${seenAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
