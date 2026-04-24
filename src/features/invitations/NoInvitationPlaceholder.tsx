import { Link } from "react-router";
import type { Speaker } from "@/lib/types";

interface Props {
  speaker: Speaker;
  speakerId: string;
  date: string;
  onNavigate?: () => void;
}

/** Renders inside the BishopInvitationDialog when no in-app invitation
 *  has been provisioned yet (or the one that was wiped). Copy pivots
 *  on the speaker's current status so a bishop who just printed the
 *  letter and marked the speaker invited doesn't see a contradictory
 *  "no invitation has been sent yet" message. */
export function NoInvitationPlaceholder({
  speaker,
  speakerId,
  date,
  onNavigate,
}: Props): React.ReactElement {
  const prepareHref = `/week/${date}/speaker/${speakerId}/prepare`;
  const view = deriveView(speaker);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-10 bg-chalk overflow-y-auto">
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
      <Link
        to={prepareHref}
        onClick={onNavigate}
        className="font-sans text-[13px] font-semibold px-4 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors"
      >
        {view.ctaLabel}
      </Link>
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
