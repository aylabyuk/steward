import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { inviteAuth } from "@/lib/firebase";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { QuickActionButtons } from "./QuickActionButtons";
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
      <header className="flex items-start gap-3 px-4 py-3 border-b border-border bg-parchment">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Conversation with the bishopric
          </div>
          <p className="font-serif text-[12.5px] text-walnut-2 mt-0.5">
            This is a group conversation — the bishop, counselors, and clerks can all see and reply.
          </p>
        </div>
        {props.onClose && (
          <button
            type="button"
            onClick={props.onClose}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-walnut-3 hover:text-walnut px-2 py-1 transition-colors"
            aria-label="Close conversation"
          >
            Close
          </button>
        )}
      </header>

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
