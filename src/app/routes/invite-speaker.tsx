import { useParams } from "react-router";
import { SpeakerInvitationChat } from "@/features/invitations/SpeakerInvitationChat";
import { TwilioChatProvider } from "@/features/invitations/twilioClientProvider";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { useSpeakerInvitation } from "@/features/templates/useSpeakerInvitation";
import type { SpeakerInvitation } from "@/lib/types";
import { ExpiredState, NonReadyState, PrintToolbar } from "./invite-speaker-states";

/**
 * Public landing page for an invitation link. Speakers open this URL
 * from whatever channel the bishop sent (email / SMS); they see the
 * frozen letter first, a conversation pane below, and can reply via
 * Yes/No quick actions + free-text chat. The page itself is auth-
 * less; writes (chat + response) require Google sign-in + email
 * match against the invitation's snapshotted speakerEmail, gated
 * inside <SpeakerInvitationChat>.
 */
export function SpeakerInvitationLandingPage(): React.ReactElement {
  const { wardId, token } = useParams<{ wardId: string; token: string }>();
  const state = useSpeakerInvitation(wardId, token);

  if (state.kind !== "ready") return <NonReadyState state={state} />;
  if (isExpired(state.invitation)) return <ExpiredState invitation={state.invitation} />;
  const { invitation } = state;

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
          {invitation.conversationSid && wardId && token && (
            <SpeakerInvitationChat
              wardId={wardId}
              token={token}
              conversationSid={invitation.conversationSid}
              speakerName={invitation.speakerName}
              speakerEmail={invitation.speakerEmail}
              hasResponse={!!invitation.response}
            />
          )}
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
