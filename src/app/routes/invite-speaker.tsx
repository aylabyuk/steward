import { useParams } from "react-router";
import { SpeakerInvitationChat } from "@/features/invitations/SpeakerInvitationChat";
import { TwilioChatProvider } from "@/features/invitations/twilioClientProvider";
import { useInvitationSession } from "@/features/invitations/useInvitationSession";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { useSpeakerInvitation } from "@/features/templates/useSpeakerInvitation";
import type { SpeakerInvitation } from "@/lib/types";
import { ExpiredState, NonReadyState, PrintToolbar, SessionGate } from "./invite-speaker-states";

/**
 * Public landing page for an invitation link. Speakers open this URL
 * from the text message we sent them; they see the frozen letter
 * first, a conversation pane below, and can reply via Yes/No quick
 * actions + free-text chat. The page itself is auth-less; the
 * <SessionGate> component kicks off capability-token exchange on
 * user tap (not automatically on GET, so SMS-app prefetchers can't
 * burn the token). All Firebase reads on this page route through
 * the isolated `inviteApp` so a bishopric Google session on the
 * same browser stays untouched.
 */
export function SpeakerInvitationLandingPage(): React.ReactElement {
  const { wardId, invitationId, token } = useParams<{
    wardId: string;
    invitationId: string;
    token: string;
  }>();
  const letter = useSpeakerInvitation(wardId, invitationId, { useInviteApp: true });
  const session = useInvitationSession({
    wardId,
    invitationId,
    invitationToken: token,
  });

  if (letter.kind !== "ready") return <NonReadyState state={letter} />;
  if (isExpired(letter.invitation)) return <ExpiredState invitation={letter.invitation} />;
  const { invitation } = letter;

  return (
    <TwilioChatProvider>
      <main className="min-h-dvh bg-[#e6ddc7]">
        <div className="max-w-3xl mx-auto flex flex-col gap-4 py-6 px-4">
          <PrintToolbar />
          <PrintOnlyLetter
            wardName={invitation.wardName}
            assignedDate={invitation.assignedDate}
            today={invitation.sentOn}
            bodyMarkdown={invitation.bodyMarkdown}
            footerMarkdown={invitation.footerMarkdown}
          />
          <div className="bg-chalk border border-border rounded-lg shadow-elev-1 overflow-hidden">
            <ScaledLetterPreview
              naked
              height="50vh"
              wardName={invitation.wardName}
              assignedDate={invitation.assignedDate}
              today={invitation.sentOn}
              bodyMarkdown={invitation.bodyMarkdown}
              footerMarkdown={invitation.footerMarkdown}
            />
          </div>
          <SessionGate status={session.status} onStart={session.start}>
            {invitation.conversationSid && wardId && invitationId && (
              <SpeakerInvitationChat
                wardId={wardId}
                invitationId={invitationId}
                conversationSid={invitation.conversationSid}
                speakerName={invitation.speakerName}
                bishopricParticipants={invitation.bishopricParticipants}
                hasResponse={!!invitation.response}
              />
            )}
          </SessionGate>
        </div>
      </main>
    </TwilioChatProvider>
  );
}

function isExpired(invitation: SpeakerInvitation): boolean {
  if (!invitation.expiresAt) return false;
  const t = invitation.expiresAt as { toMillis?: () => number };
  if (typeof t.toMillis === "function") return t.toMillis() <= Date.now();
  return false;
}
