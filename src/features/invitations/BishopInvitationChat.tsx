import { useEffect, useState } from "react";
import { upsertPrayerParticipant } from "@/features/prayers/prayerActions";
import { updateSpeaker } from "@/features/speakers/speakerActions";
import type { PrayerRole } from "@/lib/types";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useAuthStore } from "@/stores/authStore";
import type { Speaker, SpeakerInvitation, SpeakerStatus } from "@/lib/types";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { InvitationStatusBanner } from "./InvitationStatusBanner";
import { TypingIndicator } from "./TypingIndicator";
import { applyResponseToSpeaker } from "./utils/invitationActions";
import { callIssueSpeakerSession } from "./utils/invitationsCallable";
import { removeMessage, updateMessageBody } from "./utils/messageMutations";
import { noteBishopStatusChange } from "./utils/statusChangeNotice";
import { useBishopAuthors } from "./hooks/useBishopAuthors";
import { useConversation } from "./hooks/useConversation";
import { useFirstUnreadIndex } from "./hooks/useFirstUnreadIndex";
import { useReadHorizon } from "./hooks/useReadHorizon";
import { useTypingParticipants } from "./hooks/useTypingParticipants";
import { useTwilioChat } from "./TwilioChatProvider";

interface Props {
  wardId: string;
  invitationId: string;
  invitation: SpeakerInvitation;
  /** Owner speaker doc for this invitation. Threaded through so the
   *  status banner can surface the ward-set status + audit
   *  provenance without re-deriving from invitation shape alone. */
  speaker: Speaker;
  date: string;
  speakerId: string;
}

/** Bishop-side conversation pane rendered on the Prepare Invitation
 *  page after an invitation has been sent. Auto-connects the Twilio
 *  client on mount. Above the thread, a Response strip surfaces the
 *  speaker's Yes/No reply (when they've submitted one) with an
 *  Apply button that writes speaker.status + stamps acknowledgement. */
export function BishopInvitationChat({
  wardId,
  invitationId,
  invitation,
  speaker,
  date,
  speakerId,
}: Props): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const members = useWardMembers();
  const twilio = useTwilioChat();
  const { messages, conversation, authors, loading } = useConversation(
    invitation.conversationSid ?? null,
  );
  const firstUnreadIndex = useFirstUnreadIndex(conversation);
  const readHorizon = useReadHorizon(conversation, twilio.identity);
  const typing = useTypingParticipants(conversation, twilio.identity);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const resolvedAuthors = useBishopAuthors({
    members: members.data,
    invitation,
    invitationId,
    user,
    authors,
  });

  async function onStatusChange(next: SpeakerStatus) {
    setApplyError(null);
    try {
      if (invitation.kind === "prayer") {
        await upsertPrayerParticipant(wardId, date, speakerId as PrayerRole, { status: next });
      } else {
        await updateSpeaker(wardId, date, speakerId, { status: next });
      }
      await noteBishopStatusChange({
        wardId,
        invitationId,
        meetingDate: date,
        status: next,
        conversation,
      });
    } catch (err) {
      setApplyError((err as Error).message);
    }
  }

  useEffect(() => {
    if (twilio.status === "idle") void twilio.connect({ wardId });
  }, [twilio, wardId]);

  // Backfill bishopric participant on the Twilio conversation for
  // this invitation. sendSpeakerInvitation snapshots the bishopric
  // roster at send time, so a member added/activated afterward isn't
  // a participant and can't fetch the conversation. issueSpeakerSession
  // adds them idempotently when we pass invitationId.
  useEffect(() => {
    void callIssueSpeakerSession({ wardId, invitationId }).catch(() => {
      // backfill is best-effort; failures are logged server-side
    });
  }, [wardId, invitationId]);

  // Mark-read horizon bumps whenever the bishop is actively viewing
  // the thread and new messages land. Clears the unread badge on the
  // Sunday card's chat icon without additional plumbing.
  useEffect(() => {
    if (!conversation || messages.length === 0) return;
    void conversation.setAllMessagesRead();
  }, [conversation, messages.length]);

  async function onApply() {
    if (!user) return;
    setApplying(true);
    setApplyError(null);
    try {
      await applyResponseToSpeaker({ wardId, invitationId, bishopUid: user.uid });
      const applied = invitation.response?.answer === "yes" ? "confirmed" : "declined";
      await noteBishopStatusChange({
        wardId,
        invitationId,
        meetingDate: date,
        status: applied,
        conversation,
      });
    } catch (err) {
      setApplyError((err as Error).message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="bg-chalk flex-1 flex flex-col min-h-0 overflow-hidden">
      <InvitationStatusBanner
        speaker={speaker}
        invitation={invitation}
        members={members}
        onApply={onApply}
        applying={applying}
        applyError={applyError}
        onStatusChange={onStatusChange}
        currentUserUid={user?.uid}
      />

      <ConversationThread
        messages={messages}
        currentIdentity={twilio.identity}
        authors={resolvedAuthors}
        loading={loading && twilio.status !== "ready"}
        firstUnreadIndex={firstUnreadIndex}
        readHorizonIndex={readHorizon}
        fillHeight
        onDeleteMessage={(sid) => removeMessage(conversation, sid)}
        onEditMessage={(sid, next) => updateMessageBody(conversation, sid, next)}
      />

      <TypingIndicator typingIdentities={typing} authors={resolvedAuthors} />

      <ConversationComposer
        conversation={conversation}
        placeholder="Message the speaker…"
        disabled={twilio.status !== "ready"}
        showSmsHint
      />
    </section>
  );
}
