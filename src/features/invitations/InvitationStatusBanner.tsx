import { SpeakerStatusPills } from "@/features/schedule/SpeakerStatusPills";
import { statusProvenanceLabel } from "@/features/schedule/statusProvenance";
import type { SubState } from "@/hooks/_sub";
import { cn } from "@/lib/cn";
import type { Member, Speaker, SpeakerInvitation, SpeakerStatus, WithId } from "@/lib/types";
import { deriveBannerView, formatLastSeen } from "./invitationBannerView";

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
  /** Called by the status pills for manual overrides. Writes through
   *  to `updateSpeaker({ status })` which stamps
   *  `statusSource=manual` + `statusSetBy` + `statusSetAt`. */
  onStatusChange: (status: SpeakerStatus) => void;
}

/** Bishop-side banner above the invitation chat thread. Replaces the
 *  old terse "RESPONSE · YES · APPLIED · STATUS IS CONFIRMED"
 *  eyebrow with a plain-English, colour-coded state message + inline
 *  status pills for mid-flight overrides + a speaker-read-receipt
 *  line when the speaker has been on the invite page. */
export function InvitationStatusBanner({
  speaker,
  invitation,
  members,
  onApply,
  applying,
  applyError,
  onStatusChange,
}: Props) {
  const view = deriveBannerView(speaker, invitation);
  const lastSeen = formatLastSeen(invitation.speakerLastSeenAt);
  const provenance = statusProvenanceLabel(speaker, members);

  return (
    <div className={cn("px-4 py-3.5 border-b border-border", view.bg)}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className={cn("font-sans text-[13.5px] font-semibold leading-snug", view.text)}>
            {view.message}
          </p>
          {invitation.response?.reason && (
            <p className="font-serif italic text-[12.5px] text-walnut-2 mt-1">
              "{invitation.response.reason}"
            </p>
          )}
          {lastSeen && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-walnut-3 mt-1.5">
              {lastSeen}
            </p>
          )}
        </div>
        {view.showApply && (
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep disabled:opacity-60 shrink-0"
          >
            {applying ? "Applying…" : view.applyLabel}
          </button>
        )}
      </div>
      {applyError && <p className="font-sans text-[11.5px] text-bordeaux mt-2">{applyError}</p>}
      <div className="mt-3">
        <SpeakerStatusPills status={speaker.status ?? "planned"} onChange={onStatusChange} />
        {provenance && (
          <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-walnut-3 -mt-1">
            {provenance}
          </p>
        )}
      </div>
    </div>
  );
}
