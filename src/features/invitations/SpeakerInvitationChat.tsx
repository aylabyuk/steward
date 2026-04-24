import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { inviteAuth } from "@/lib/firebase";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { QuickActionButtons } from "./QuickActionButtons";
import { SpeakerChatHeader } from "./SpeakerChatHeader";
import { SpeakerResponseBanner } from "./SpeakerResponseBanner";
import { TypingIndicator } from "./TypingIndicator";
import { useConversation } from "./useConversation";
import { useFirstUnreadIndex } from "./useFirstUnreadIndex";
import { useReadHorizon } from "./useReadHorizon";
import { useTypingParticipants } from "./useTypingParticipants";
import { useSpeakerHeartbeat } from "./useSpeakerHeartbeat";
import { useTwilioChat } from "./twilioClientProvider";
import { writeSpeakerResponse } from "./invitationActions";
import { buildSpeakerAuthorMap } from "./speakerAuthorMap";

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
   *  Takes precedence over `responseAnswer` in the banner so a
   *  speaker who said yes but then asked to bow out (and the bishop
   *  flipped status to declined) sees the accurate outcome. */
  currentStatus?: import("@/lib/types").SpeakerStatus | null;
  /** When present, the chat's header renders a small close affordance
   *  that invokes this callback. Used by the invite page's floating
   *  drawer so the speaker can dismiss the chat back over the letter. */
  onClose?: () => void;
  /** When true, the chat fills its flex parent (used inside the
   *  floating drawer on the invite page). Default layout stays inline
   *  for other callsites. */
  fillHeight?: boolean;
}

/** Speaker-side chat pane. By the time this renders the parent
 *  SessionGate has already exchanged the capability token for a
 *  Firebase custom-token session on the isolated `inviteAuth`, so
 *  every write here is authorized; no modal gate needed. */
export function SpeakerInvitationChat(props: Props): React.ReactElement {
  const [user, setUser] = useState<User | null>(inviteAuth.currentUser);
  const twilio = useTwilioChat();
  const { messages, conversation, authors, loading } = useConversation(props.conversationSid);
  const firstUnreadIndex = useFirstUnreadIndex(conversation);
  const readHorizon = useReadHorizon(conversation, twilio.identity);
  const typing = useTypingParticipants(conversation, twilio.identity);

  useEffect(() => onAuthStateChanged(inviteAuth, setUser), []);
  useSpeakerHeartbeat({
    wardId: props.wardId,
    invitationId: props.invitationId,
    enabled: Boolean(user),
  });

  // Kick off the Twilio client as soon as the chat mounts so prior
  // messages load before the speaker taps Send. Without this, the
  // conversation pane would stay empty until the first interaction
  // and the first send attempt would race the connect and throw
  // "Not connected."
  useEffect(() => {
    if (twilio.status !== "idle") return;
    void twilio.connect({
      wardId: props.wardId,
      invitationId: props.invitationId,
      useInviteApp: true,
    });
  }, [twilio, props.wardId, props.invitationId]);

  // Clear the speaker's unread horizon whenever they're viewing the
  // chat and new messages land. Drives the page-level "New message"
  // banner down to quiet once the speaker has actually seen the
  // bishopric's reply — without this, the banner stays lit even
  // after the drawer has been opened.
  useEffect(() => {
    if (!conversation || messages.length === 0) return;
    void conversation.setAllMessagesRead();
  }, [conversation, messages.length]);

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
      />

      <ConversationThread
        messages={messages}
        currentIdentity={twilio.identity}
        authors={resolvedAuthors}
        loading={loading && twilio.status === "ready"}
        firstUnreadIndex={firstUnreadIndex}
        readHorizonIndex={readHorizon}
        {...(props.fillHeight ? { fillHeight: true } : {})}
      />

      <TypingIndicator typingIdentities={typing} authors={resolvedAuthors} />

      {!props.hasResponse && (
        <QuickActionButtons
          conversation={conversation}
          ensureReady={ensureReady}
          onSubmit={submitResponse}
          meetingDate={props.meetingDate}
        />
      )}

      <ConversationComposer
        conversation={conversation}
        ensureReady={ensureReady}
        placeholder="Reply to the bishopric…"
      />
    </section>
  );
}
