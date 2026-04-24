import { Link } from "react-router";
import type { Speaker } from "@/lib/types";

interface Props {
  speaker: Speaker;
  speakerId: string;
  date: string;
  onNavigate?: () => void;
}

/** Renders inside the BishopInvitationDialog when the speaker hasn't
 *  been invited through Steward yet — the in-app chat channel isn't
 *  available because no Twilio conversation has been provisioned. We
 *  tell the bishopric that directly and offer a direct path to the
 *  Prepare Invitation page where they can send or print the letter
 *  (print works even when the speaker has no phone or email on
 *  file — see prepare-invitation.tsx's action bar). */
export function NoInvitationPlaceholder({
  speaker,
  speakerId,
  date,
  onNavigate,
}: Props): React.ReactElement {
  const prepareHref = `/week/${date}/speaker/${speakerId}/prepare`;
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
        <p className="font-sans text-[15px] font-semibold text-walnut">
          Chat is available once you've sent an invitation
        </p>
        <p className="font-serif italic text-[13.5px] text-walnut-2 mt-1.5 leading-relaxed">
          No Steward invitation has been sent to {speaker.name} yet, so there's no in-app
          conversation to open. Prepare the invitation to send or print it — the chat opens
          automatically once an invitation is on file.
        </p>
      </div>
      <Link
        to={prepareHref}
        onClick={onNavigate}
        className="font-sans text-[13px] font-semibold px-4 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors"
      >
        Prepare invitation
      </Link>
    </div>
  );
}
