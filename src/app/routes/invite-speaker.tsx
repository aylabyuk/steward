import { useState } from "react";
import { useParams } from "react-router";
import { SpeakerInvitationChat } from "@/features/invitations/SpeakerInvitationChat";
import { TwilioChatProvider } from "@/features/invitations/twilioClientProvider";
import { useConversationUnread } from "@/features/invitations/useConversationUnread";
import { useInvitationSession } from "@/features/invitations/useInvitationSession";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { useSpeakerInvitation } from "@/features/templates/useSpeakerInvitation";
import type { SpeakerInvitation } from "@/lib/types";
import { SpeakerChatFloatingDrawer } from "./invite-speaker-chat-drawer";
import { SpeakerChatCTABanner, type CtaVariant } from "./invite-speaker-cta-banner";
import { ExpiredState, NonReadyState, PrintToolbar, SessionGate } from "./invite-speaker-states";

/**
 * Public landing page for an invitation link. The letter fills the
 * viewport; the print toolbar floats top-right, and the conversation
 * with the bishopric lives in a floating drawer (FAB when collapsed,
 * sheet/panel when open). The page itself is auth-less; the
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

  return (
    <TwilioChatProvider>
      <InviteLandingContent
        invitation={letter.invitation}
        session={session}
        wardId={wardId}
        invitationId={invitationId}
      />
    </TwilioChatProvider>
  );
}

interface ContentProps {
  invitation: SpeakerInvitation;
  session: ReturnType<typeof useInvitationSession>;
  wardId: string | undefined;
  invitationId: string | undefined;
}

function InviteLandingContent({
  invitation,
  session,
  wardId,
  invitationId,
}: ContentProps): React.ReactElement {
  const [chatOpen, setChatOpen] = useState(false);
  const unread = useConversationUnread(invitation.conversationSid);
  const hasUnread = typeof unread === "number" && unread > 0;
  // Derived attention state: what, if anything, should nudge the
  // speaker toward the chat right now. Banner + FAB both key off this
  // so they emerge and vanish together. When the drawer is open the
  // chat is already visible — no nudge needed.
  const promptVariant: CtaVariant | null = chatOpen
    ? null
    : !invitation.response
      ? "reply"
      : hasUnread
        ? "unread"
        : null;

  return (
    <main className="fixed inset-0 bg-[#e6ddc7] overflow-hidden">
      <PrintOnlyLetter
        wardName={invitation.wardName}
        assignedDate={invitation.assignedDate}
        today={invitation.sentOn}
        bodyMarkdown={invitation.bodyMarkdown}
        footerMarkdown={invitation.footerMarkdown}
      />
      <div className="absolute inset-0">
        <ScaledLetterPreview
          naked
          height="100dvh"
          wardName={invitation.wardName}
          assignedDate={invitation.assignedDate}
          today={invitation.sentOn}
          bodyMarkdown={invitation.bodyMarkdown}
          footerMarkdown={invitation.footerMarkdown}
        />
      </div>

      {promptVariant && (
        <SpeakerChatCTABanner variant={promptVariant} onTap={() => setChatOpen(true)} />
      )}

      <div className="absolute top-4 right-4 z-10 pt-[env(safe-area-inset-top)]">
        <PrintToolbar />
      </div>

      <SpeakerChatFloatingDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        attention={promptVariant}
      >
        <SessionGate status={session.status} onStart={session.start}>
          {invitation.conversationSid && wardId && invitationId && (
            <SpeakerInvitationChat
              wardId={wardId}
              invitationId={invitationId}
              conversationSid={invitation.conversationSid}
              speakerName={invitation.speakerName}
              bishopricParticipants={invitation.bishopricParticipants}
              hasResponse={!!invitation.response}
              responseAnswer={invitation.response?.answer ?? null}
              onClose={() => setChatOpen(false)}
              fillHeight
            />
          )}
        </SessionGate>
      </SpeakerChatFloatingDrawer>
    </main>
  );
}

function isExpired(invitation: SpeakerInvitation): boolean {
  if (!invitation.expiresAt) return false;
  const t = invitation.expiresAt as { toMillis?: () => number };
  if (typeof t.toMillis === "function") return t.toMillis() <= Date.now();
  return false;
}
