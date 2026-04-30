import { SpeakerStatusMenu } from "@/features/schedule/SpeakerStatusMenu";
import { statusProvenanceLabel } from "@/features/schedule/utils/statusProvenance";
import type { SubState } from "@/hooks/_sub";
import type { Member, Speaker, SpeakerInvitation, SpeakerStatus, WithId } from "@/lib/types";
import { cn } from "@/lib/cn";
import { deriveBannerView, formatLastSeen } from "./utils/invitationBannerView";

interface Props {
  speaker: Speaker;
  invitation: SpeakerInvitation;
  members: SubState<WithId<Member>[]>;
  /** Called by the Apply button when the speaker has replied and
   *  the bishop hasn't yet stamped `acknowledgedAt` on the response.
   *  Delegates to the existing applyResponseToSpeaker path (stamps
   *  acknowledgment + mirrors status + sets `statusSource=
   *  speaker-response`). */
  onApply: () => void;
  applying: boolean;
  applyError: string | null;
  /** Called by the status menu for manual overrides. Writes through
   *  to `updateSpeaker({ status })` which stamps
   *  `statusSource=manual` + `statusSetBy` + `statusSetAt`. */
  onStatusChange: (status: SpeakerStatus) => void;
  /** Current signed-in user's uid. Used by the menu's confirm dialog
   *  to suppress the "someone else set this" context line when the
   *  same user is overriding their own earlier choice. */
  currentUserUid?: string | undefined;
}

/** Bishop-side banner above the invitation chat thread. Flat against
 *  the chat parchment background — the prior full-bleed tone fill
 *  triple-encoded status (sentence + segment + bg colour) and ate
 *  ~30% of the screen above the chat. The (now tappable)
 *  `SpeakerStatusMenu` badge sits inline with the message text and
 *  doubles as the edit affordance — single row carries status badge
 *  + plain-English message + Apply CTA when the speaker has replied.
 *  Reason quote, last-seen, and provenance lines render only when
 *  their data is present, each on its own row beneath. */
export function InvitationStatusBanner({
  speaker,
  invitation,
  members,
  onApply,
  applying,
  applyError,
  onStatusChange,
  currentUserUid,
}: Props) {
  const view = deriveBannerView(speaker, invitation);
  const lastSeen = formatLastSeen(invitation.speakerLastSeenAt, invitation.kind);
  const provenance = statusProvenanceLabel(speaker, members);

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2.5 flex-wrap">
        <SpeakerStatusMenu
          status={speaker.status ?? "planned"}
          onChange={onStatusChange}
          currentStatusSource={speaker.statusSource}
          currentStatusSetBy={speaker.statusSetBy}
          members={members}
          currentUserUid={currentUserUid}
        />
        <p
          className={cn(
            "font-sans text-[13.5px] font-semibold leading-snug min-w-0 flex-1",
            view.text,
          )}
        >
          {view.message}
        </p>
      </div>
      {invitation.response?.reason && (
        <p className="font-serif italic text-[12.5px] text-walnut-2 mt-1.5">
          "{invitation.response.reason}"
        </p>
      )}
      {lastSeen && (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-walnut-3 mt-1.5">
          {lastSeen}
        </p>
      )}
      {provenance && (
        <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-walnut-3 mt-1">
          {provenance}
        </p>
      )}
      {view.showApply && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep disabled:opacity-60"
          >
            {applying ? "Applying…" : view.applyLabel}
          </button>
        </div>
      )}
      {applyError && <p className="font-sans text-[11.5px] text-bordeaux mt-2">{applyError}</p>}
    </div>
  );
}
