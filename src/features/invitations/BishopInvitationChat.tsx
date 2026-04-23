import { useEffect, useMemo, useState } from "react";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useAuthStore } from "@/stores/authStore";
import type { SpeakerInvitation } from "@/lib/types";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { ResponseStrip } from "./ResponseStrip";
import { applyResponseToSpeaker } from "./invitationActions";
import { callIssueSpeakerSession } from "./invitationsCallable";
import { useConversation, type AuthorInfo, type AuthorMap } from "./useConversation";
import { useTwilioChat } from "./twilioClientProvider";

interface Props {
  wardId: string;
  invitationId: string;
  invitation: SpeakerInvitation;
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
}: Props): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const members = useWardMembers();
  const twilio = useTwilioChat();
  const { messages, conversation, authors, loading } = useConversation(
    invitation.conversationSid ?? null,
  );
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Merge author resolution: ward-member displayNames + the speaker
  // snapshot on the invitation + the current user's Firebase Auth
  // photoURL form a fallback map, then Twilio participant attributes
  // (when present) overlay it. That way old conversations without
  // attributes still render real names, and new conversations get
  // the richer Twilio-sourced data.
  const resolvedAuthors: AuthorMap = useMemo(() => {
    const map = new Map<string, AuthorInfo>();
    for (const m of members.data ?? []) {
      if (m.data.role !== "bishopric" && m.data.role !== "clerk") continue;
      if (!m.data.active) continue;
      const info: AuthorInfo = { displayName: m.data.displayName, role: m.data.role };
      if (m.data.email) info.email = m.data.email;
      map.set(`uid:${m.id}`, info);
    }
    const speakerInfo: AuthorInfo = { displayName: invitation.speakerName, role: "speaker" };
    if (invitation.speakerEmail) speakerInfo.email = invitation.speakerEmail;
    if (invitation.response?.actorEmail) speakerInfo.email = invitation.response.actorEmail;
    map.set(`speaker:${invitationId}`, speakerInfo);
    if (user?.uid) {
      const existing = map.get(`uid:${user.uid}`);
      const info: AuthorInfo = {
        displayName: existing?.displayName ?? user.displayName ?? "You",
      };
      if (existing?.role) info.role = existing.role;
      if (user.photoURL) info.photoURL = user.photoURL;
      const email = existing?.email ?? user.email;
      if (email) info.email = email;
      map.set(`uid:${user.uid}`, info);
    }
    for (const [id, info] of authors) {
      const existing = map.get(id);
      map.set(id, { ...existing, ...info });
    }
    return map;
  }, [
    members.data,
    invitationId,
    invitation.speakerName,
    invitation.speakerEmail,
    invitation.response?.actorEmail,
    user,
    authors,
  ]);

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
    } catch (err) {
      setApplyError((err as Error).message);
    } finally {
      setApplying(false);
    }
  }

  const response = invitation.response;
  const needsApply = Boolean(response && !response.acknowledgedAt);

  return (
    <section className="bg-chalk border border-border rounded-lg shadow-elev-1 flex flex-col overflow-hidden">
      <header className="px-4 py-3 border-b border-border bg-parchment">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
          Conversation with {invitation.speakerName}
        </div>
      </header>

      {response && (
        <ResponseStrip
          response={response}
          needsApply={needsApply}
          applying={applying}
          onApply={onApply}
          error={applyError}
        />
      )}

      <ConversationThread
        messages={messages}
        currentIdentity={twilio.identity}
        authors={resolvedAuthors}
        loading={loading && twilio.status !== "ready"}
      />

      <ConversationComposer
        conversation={conversation}
        placeholder="Message the speaker…"
        disabled={twilio.status !== "ready"}
      />
    </section>
  );
}
