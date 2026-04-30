import { useMemo } from "react";
import { BuiltByCredit } from "@/components/BuiltByCredit";
import { inviteAuth } from "@/lib/firebase";
import type { SpeakerStatus } from "@/lib/types";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { QuickActionButtons } from "./QuickActionButtons";
import { SpeakerChatHeader } from "./SpeakerChatHeader";
import { SpeakerResponseBanner } from "./SpeakerResponseBanner";
import { TypingIndicator } from "./TypingIndicator";
import { useConversation } from "./hooks/useConversation";
import { useFirstUnreadIndex } from "./hooks/useFirstUnreadIndex";
import { useReadHorizon } from "./hooks/useReadHorizon";
import { useSpeakerChatLifecycle } from "./hooks/useSpeakerChatLifecycle";
import { useTypingParticipants } from "./hooks/useTypingParticipants";
import { useTwilioChat } from "./TwilioChatProvider";
import { writeSpeakerResponse } from "./utils/invitationActions";
import { postMessageDeletedNotice } from "./utils/messageDeletedNotice";
import { removeMessage, toggleMessageReaction, updateMessageBody } from "./utils/messageMutations";
import { buildSpeakerAuthorMap } from "./utils/speakerAuthorMap";

interface Props {
  wardId: string;
  invitationId: string;
  conversationSid: string;
  speakerName: string;
  bishopricParticipants: readonly {
    uid: string;
    displayName: string;
    role: "bishopric" | "clerk";
    email?: string | undefined;
  }[];
  hasResponse: boolean;
  /** ISO `YYYY-MM-DD` of the meeting the speaker is assigned to —
   *  substituted into QuickAction prompts and the response banner so
   *  copy reads "speak on Sun May 20" instead of the ambiguous
   *  "this Sunday". */
  meetingDate: string;
  /** The speaker's own answer. Drives the "You accepted / declined"
   *  banner above the thread so they always see their committed
   *  answer after submission. Null before they reply. */
  responseAnswer?: "yes" | "no" | null;
  /** Mirror of the speaker doc's current status, written onto the
   *  invitation by the bishop's client when they confirm / decline.
   *  Takes precedence over `responseAnswer` in the banner. */
  currentStatus?: SpeakerStatus | null;
  /** When present, the chat's header renders a small close affordance
   *  that invokes this callback. Used by the invite page's floating
   *  drawer so the speaker can dismiss the chat back over the letter. */
  onClose?: () => void;
  /** When true, the chat fills its flex parent (used inside the
   *  floating drawer on the invite page). Default layout stays inline
   *  for other callsites. */
  fillHeight?: boolean;
  /** Discriminator from the invitation doc — adjusts the response
   *  banner copy from "speaking" to "prayer" wording. */
  kind?: "speaker" | "prayer";
}

/** Speaker-side chat pane. By the time this renders the parent
 *  SessionGate has already exchanged the capability token for a
 *  Firebase custom-token session on the isolated `inviteAuth`, so
 *  every write here is authorized; no modal gate needed. */
export function SpeakerInvitationChat(props: Props): React.ReactElement {
  const twilio = useTwilioChat();
  const { messages, conversation, authors, loading } = useConversation(props.conversationSid);
  const firstUnreadIndex = useFirstUnreadIndex(conversation);
  const readHorizon = useReadHorizon(conversation, twilio.identity);
  const typing = useTypingParticipants(conversation, twilio.identity);
  const user = useSpeakerChatLifecycle({
    wardId: props.wardId,
    invitationId: props.invitationId,
    conversation,
    messageCount: messages.length,
    twilio,
  });

  const resolvedAuthors = useMemo(
    () =>
      buildSpeakerAuthorMap({
        invitationId: props.invitationId,
        speakerName: props.speakerName,
        bishopricParticipants: props.bishopricParticipants,
        user,
        twilioIdentity: twilio.identity,
        liveAuthors: authors,
      }),
    [
      props.invitationId,
      props.speakerName,
      props.bishopricParticipants,
      twilio.identity,
      user,
      authors,
    ],
  );

  async function ensureReady(): Promise<boolean> {
    if (twilio.status === "idle" || twilio.status === "error") {
      await twilio.connect({
        wardId: props.wardId,
        invitationId: props.invitationId,
        useInviteApp: true,
      });
    }
    return true;
  }

  async function submitResponse(answer: "yes" | "no", reason?: string): Promise<void> {
    const current = inviteAuth.currentUser;
    if (!current) throw new Error("Session lost. Reload the page.");
    await writeSpeakerResponse({
      wardId: props.wardId,
      invitationId: props.invitationId,
      answer,
      ...(reason ? { reason } : {}),
      actorUid: current.uid,
    });
  }

  async function onDelete(sid: string) {
    await removeMessage(conversation, sid);
    await postMessageDeletedNotice(conversation, props.speakerName);
  }

  return (
    <section
      className={
        props.fillHeight
          ? "bg-chalk flex flex-col overflow-hidden flex-1 min-h-0"
          : "bg-chalk border border-border rounded-lg shadow-elev-1 flex flex-col overflow-hidden"
      }
    >
      <SpeakerChatHeader onClose={props.onClose} />
      <SpeakerResponseBanner
        answer={props.responseAnswer}
        meetingDate={props.meetingDate}
        {...(props.currentStatus !== undefined ? { currentStatus: props.currentStatus } : {})}
        {...(props.kind ? { kind: props.kind } : {})}
      />
      <ConversationThread
        messages={messages}
        currentIdentity={twilio.identity}
        authors={resolvedAuthors}
        loading={loading && twilio.status === "ready"}
        firstUnreadIndex={firstUnreadIndex}
        readHorizonIndex={readHorizon}
        {...(props.fillHeight ? { fillHeight: true } : {})}
        onDeleteMessage={onDelete}
        onEditMessage={(sid, next) => updateMessageBody(conversation, sid, next)}
        {...(twilio.identity
          ? {
              onToggleReaction: (sid: string, emoji: string) =>
                toggleMessageReaction(conversation, sid, twilio.identity!, emoji),
            }
          : {})}
      />
      <TypingIndicator typingIdentities={typing} authors={resolvedAuthors} />
      {!props.hasResponse && (
        <QuickActionButtons
          conversation={conversation}
          ensureReady={ensureReady}
          onSubmit={submitResponse}
          meetingDate={props.meetingDate}
          {...(props.kind ? { kind: props.kind } : {})}
        />
      )}
      <ConversationComposer
        conversation={conversation}
        ensureReady={ensureReady}
        placeholder="Reply to the bishopric…"
      />
      <div className="flex justify-center py-2 px-4 border-t border-border">
        <BuiltByCredit />
      </div>
    </section>
  );
}
