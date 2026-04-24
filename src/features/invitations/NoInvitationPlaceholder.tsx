import type { Speaker } from "@/lib/types";

interface Props {
  speaker: Speaker;
}

/** Renders inside the BishopInvitationDialog when the speaker hasn't
 *  been invited through Steward yet — the in-app chat channel isn't
 *  available because no Twilio conversation has been provisioned. We
 *  tell the bishopric that directly and suggest external contact
 *  methods they can use right now, so the dialog is still useful as
 *  a consolidated "this is the speaker's state" surface. */
export function NoInvitationPlaceholder({ speaker }: Props): React.ReactElement {
  const email = speaker.email;
  const phone = speaker.phone;
  const hasContact = Boolean(email || phone);
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
          conversation to open. In the meantime, reach out directly using the details below, then
          come back here to send the formal invitation.
        </p>
      </div>
      {hasContact ? (
        <div className="w-full max-w-sm bg-parchment-2 border border-border rounded-lg p-3.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium mb-2">
            Contact directly
          </div>
          <ul className="flex flex-col gap-1.5 font-sans text-[13.5px] text-walnut">
            {phone && (
              <li>
                <a
                  href={`tel:${phone}`}
                  className="underline decoration-border hover:text-bordeaux"
                >
                  {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="underline decoration-border hover:text-bordeaux break-all"
                >
                  {email}
                </a>
              </li>
            )}
          </ul>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-parchment-2 border border-border rounded-lg p-3.5 text-center">
          <p className="font-serif italic text-[13px] text-walnut-2">
            No phone or email on file. Add contact details on the speaker's card to enable direct
            outreach.
          </p>
        </div>
      )}
    </div>
  );
}
