import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { inviteAuth } from "@/lib/firebase";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { QuickActionButtons } from "./QuickActionButtons";
import { useConversation, type AuthorInfo, type AuthorMap } from "./useConversation";
import { useSpeakerHeartbeat } from "./useSpeakerHeartbeat";
import { useTwilioChat } from "./twilioClientProvider";
import { writeSpeakerResponse } from "./invitationActions";

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
}

/** Speaker-side chat pane. By the time this renders the parent
 *  SessionGate has already exchanged the capability token for a
 *  Firebase custom-token session on the isolated `inviteAuth`, so
 *  every write here is authorized; no modal gate needed. */
export function SpeakerInvitationChat(props: Props): React.ReactElement {
  const [user, setUser] = useState<User | null>(inviteAuth.currentUser);
  const twilio = useTwilioChat();
  const { messages, conversation, authors, loading } = useConversation(props.conversationSid);

  useEffect(() => onAuthStateChanged(inviteAuth, setUser), []);
  useSpeakerHeartbeat({
    wardId: props.wardId,
    invitationId: props.invitationId,
    enabled: Boolean(user),
  });

  const resolvedAuthors: AuthorMap = useMemo(() => {
    const map = new Map<string, AuthorInfo>();
    map.set(`speaker:${props.invitationId}`, {
      displayName: props.speakerName,
      role: "speaker",
    });
    for (const m of props.bishopricParticipants) {
      const info: AuthorInfo = { displayName: m.displayName, role: m.role };
      if (m.email) info.email = m.email;
      map.set(`uid:${m.uid}`, info);
    }
    if (user && twilio.identity) {
      const existing = map.get(twilio.identity);
      const info: AuthorInfo = {
        displayName: existing?.displayName ?? user.displayName ?? props.speakerName,
      };
      if (existing?.role) info.role = existing.role;
      if (user.photoURL) info.photoURL = user.photoURL;
      map.set(twilio.identity, info);
    }
    for (const [id, info] of authors) {
      const existing = map.get(id);
      map.set(id, { ...existing, ...info });
    }
    return map;
  }, [
    props.invitationId,
    props.speakerName,
    props.bishopricParticipants,
    twilio.identity,
    user,
    authors,
  ]);

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
    <section className="bg-chalk border border-border rounded-lg shadow-elev-1 flex flex-col overflow-hidden">
      <header className="px-4 py-3 border-b border-border bg-parchment">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
          Conversation with the bishopric
        </div>
        <p className="font-serif text-[12.5px] text-walnut-2 mt-0.5">
          This is a group conversation — the bishop, counselors, and clerks can all see and reply.
        </p>
      </header>

      <ConversationThread
        messages={messages}
        currentIdentity={twilio.identity}
        authors={resolvedAuthors}
        loading={loading && twilio.status === "ready"}
      />

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
