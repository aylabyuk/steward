import { useState } from "react";
import { SpeakerStatusMenu } from "@/features/schedule/SpeakerStatusMenu";
import { statusProvenanceLabel } from "@/features/schedule/utils/statusProvenance";
import { upsertPrayerParticipant } from "@/features/prayers/utils/prayerActions";
import { updateSpeaker } from "@/features/speakers/utils/speakerActions";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useAuthStore } from "@/stores/authStore";
import type { PrayerRole, Speaker, SpeakerStatus } from "@/lib/types";

interface Props {
  wardId: string;
  speaker: Speaker;
  /** For speaker invitations: the speaker doc ID. For prayer
   *  invitations: the role string ("opening" | "benediction"),
   *  matching the prayer participant doc path. */
  speakerId: string;
  date: string;
  /** Discriminator. Defaults to "speaker"; "prayer" routes the
   *  Prepare CTA to the prayer prepare-invitation route and the
   *  status pill writes to the prayer participant doc. */
  kind?: "speaker" | "prayer";
  onNavigate?: () => void;
}

/** Renders inside the BishopInvitationDialog when no in-app invitation
 *  has been provisioned yet. The top strip mirrors the chat banner's
 *  slot — status pills + audit provenance — so the bishop can correct
 *  status without leaving the dialog. The body below carries the
 *  "invitation not sent yet" / "out-of-band invited" explanation and
 *  the CTA to open the Prepare Invitation page. Parity with the chat
 *  layout prevents the eye-movement jump when toggling between the
 *  two surfaces for adjacent speakers on the schedule. */
export function NoInvitationPlaceholder({
  wardId,
  speaker,
  speakerId,
  date,
  kind = "speaker",
  onNavigate,
}: Props): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const members = useWardMembers();
  const [statusError, setStatusError] = useState<string | null>(null);
  const prepareHref =
    kind === "prayer"
      ? `/week/${encodeURIComponent(date)}/prayer/${encodeURIComponent(speakerId)}/prepare`
      : `/week/${encodeURIComponent(date)}/speaker/${encodeURIComponent(speakerId)}/prepare`;
  const view = deriveView(speaker);
  const provenance = statusProvenanceLabel(speaker, members);

  function openPrepare() {
    // Open in a new tab to match the rest of the app (SpeakerLockedBand
    // uses the same pattern). The Prepare page's own Cancel button
    // calls window.close(), which only works when the page was opened
    // via window.open — same-tab navigation would break that button.
    window.open(prepareHref, "_blank", "noopener,noreferrer");
    onNavigate?.();
  }

  async function onStatusChange(next: SpeakerStatus) {
    setStatusError(null);
    try {
      if (kind === "prayer") {
        await upsertPrayerParticipant(wardId, date, speakerId as PrayerRole, { status: next });
      } else {
        await updateSpeaker(wardId, date, speakerId, { status: next });
      }
    } catch (err) {
      setStatusError((err as Error).message);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-chalk">
      <div className="px-4 py-3 border-b border-border">
        <SpeakerStatusMenu
          status={speaker.status ?? "planned"}
          onChange={onStatusChange}
          currentStatusSource={speaker.statusSource}
          currentStatusSetBy={speaker.statusSetBy}
          members={members}
          currentUserUid={user?.uid}
        />
        {provenance && (
          <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-walnut-3 mt-1.5">
            {provenance}
          </p>
        )}
        {statusError && <p className="font-sans text-[11.5px] text-bordeaux mt-2">{statusError}</p>}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-10 overflow-y-auto">
        <div className="w-12 h-12 rounded-full bg-parchment-2 flex items-center justify-center text-walnut-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="text-center max-w-sm">
          <p className="font-sans text-[15px] font-semibold text-walnut">{view.title}</p>
          <p className="font-serif italic text-[13.5px] text-walnut-2 mt-1.5 leading-relaxed">
            {view.body}
          </p>
        </div>
        <button
          type="button"
          onClick={openPrepare}
          className="font-sans text-[13px] font-semibold px-4 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors"
        >
          {view.ctaLabel}
        </button>
      </div>
    </div>
  );
}

interface View {
  title: string;
  body: string;
  ctaLabel: string;
}

function deriveView(speaker: Speaker): View {
  const status = speaker.status ?? "planned";
  if (status === "planned") {
    return {
      title: "Chat is available once you've sent an invitation",
      body: `No Steward invitation has been sent to ${speaker.name} yet, so there's no in-app conversation to open. Prepare the invitation to send or print it — the chat opens automatically once an invitation is on file.`,
      ctaLabel: "Prepare invitation",
    };
  }
  if (status === "invited") {
    return {
      title: `${speaker.name} was invited outside Steward`,
      body: `Their status is set to "invited" but no in-app invitation was sent (likely because you printed the letter or marked them invited by hand). The chat only works for invitations sent through Steward with an email or phone on file — follow up directly for now, or re-prepare an in-app invitation if contact details are added later.`,
      ctaLabel: "Prepare invitation anyway",
    };
  }
  if (status === "confirmed") {
    return {
      title: `${speaker.name} is confirmed`,
      body: `Their status was set outside the in-app invitation flow, so there's no Steward conversation to open here. You can still prepare and send an in-app invitation if you want chat on record — otherwise reach out directly.`,
      ctaLabel: "Prepare invitation anyway",
    };
  }
  return {
    title: `${speaker.name} declined`,
    body: `Their status was set outside the in-app invitation flow, so there's no Steward conversation to open here. Reach out directly to follow up, or prepare a fresh invitation for a replacement speaker.`,
    ctaLabel: "Prepare invitation anyway",
  };
}
