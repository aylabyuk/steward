import { useState } from "react";
import { useParams } from "react-router";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { SpeakerInvitationChat } from "@/features/invitations/SpeakerInvitationChat";
import { TwilioChatProvider } from "@/features/invitations/TwilioChatProvider";
import { useConversationUnread } from "@/features/invitations/hooks/useConversationUnread";
import { useInvitationSession } from "@/features/invitations/hooks/useInvitationSession";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { useSpeakerInvitation } from "@/features/templates/hooks/useSpeakerInvitation";
import type { SpeakerInvitation } from "@/lib/types";
import { SpeakerChatFloatingDrawer } from "./SpeakerChatFloatingDrawer";
import { SpeakerChatCTABanner, type CtaVariant } from "./SpeakerChatCTABanner";
import { ExpiredState, NonReadyState, SessionGate, ShareToolbar } from "./InviteSpeakerStates";

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
  useFullViewportLayout();
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
  // Has the speaker already responded? Post C1 doc-split, the full
  // `response` object lives on the private auth subdoc which the
  // landing page can only read once authenticated. The public parent
  // carries a `responseSummary` denorm (answer + respondedAt) so the
  // pre-auth banner can still gate correctly. Either signal counts.
  const hasResponse = Boolean(invitation.response || invitation.responseSummary);
  const responseAnswer =
    invitation.response?.answer ?? invitation.responseSummary?.answer ?? null;
  // Derived attention state: what, if anything, should nudge the
  // speaker toward the chat right now. Banner + FAB both key off this
  // so they emerge and vanish together. When the drawer is open the
  // chat is already visible — no nudge needed.
  const promptVariant: CtaVariant | null = chatOpen
    ? null
    : !hasResponse
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
        {...(invitation.editorStateJson ? { editorStateJson: invitation.editorStateJson } : {})}
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
          {...(invitation.editorStateJson ? { editorStateJson: invitation.editorStateJson } : {})}
        />
      </div>

      {promptVariant && (
        <SpeakerChatCTABanner
          variant={promptVariant}
          kind={invitation.kind}
          onTap={() => setChatOpen(true)}
        />
      )}

      <div
        className={`absolute right-4 z-10 pt-[env(safe-area-inset-top)] transition-[top] duration-200 ${
          promptVariant ? "top-16" : "top-4"
        }`}
      >
        <ShareToolbar speakerName={invitation.speakerName} assignedDate={invitation.assignedDate} />
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
              hasResponse={hasResponse}
              meetingDate={invitation.speakerRef.meetingDate}
              responseAnswer={responseAnswer}
              currentStatus={invitation.currentSpeakerStatus ?? null}
              {...(invitation.kind ? { kind: invitation.kind } : {})}
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
