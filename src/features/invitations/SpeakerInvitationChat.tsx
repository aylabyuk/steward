import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { QuickActionButtons } from "./QuickActionButtons";
import { useConversation, type AuthorInfo, type AuthorMap } from "./useConversation";
import { useTwilioChat } from "./twilioClientProvider";
import { writeSpeakerResponse } from "./invitationActions";

interface Props {
  wardId: string;
  token: string;
  conversationSid: string;
  /** Snapshotted speaker name from the invitation — seeds the author
   *  map so the speaker's own messages render with their real name
   *  even when Twilio participant attributes aren't available. */
  speakerName: string;
  /** Active bishopric + clerk snapshot from send time. Lets bishop
   *  message bubbles show real names on the speaker's side — they
   *  can't read ward members directly. */
  bishopricParticipants: readonly { uid: string; displayName: string; role: "bishopric" | "clerk" }[];
  /** True when the invitation already has a response recorded. Quick
   *  actions are hidden, composer stays available for ongoing chat. */
  hasResponse: boolean;
}

/** Speaker-side chat pane: sign-in on first write (any verified
 *  Google account), then plain chat with optional Yes/No quick
 *  actions until a response is recorded. The invitation token in
 *  the URL is the auth factor — no email-match against the
 *  invitation is enforced. */
export function SpeakerInvitationChat(props: Props): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const twilio = useTwilioChat();
  const { messages, conversation, authors, loading } = useConversation(props.conversationSid);

  const resolvedAuthors: AuthorMap = useMemo(() => {
    const map = new Map<string, AuthorInfo>();
    map.set(`speaker:${props.token}`, { displayName: props.speakerName, role: "speaker" });
    for (const m of props.bishopricParticipants) {
      map.set(`uid:${m.uid}`, { displayName: m.displayName, role: m.role });
    }
    if (user?.photoURL && twilio.identity) {
      const existing = map.get(twilio.identity);
      map.set(twilio.identity, {
        displayName: existing?.displayName ?? user.displayName ?? "You",
        ...(existing?.role ? { role: existing.role } : {}),
        photoURL: user.photoURL,
      });
    }
    for (const [id, info] of authors) {
      const existing = map.get(id);
      map.set(id, { ...existing, ...info });
    }
    return map;
  }, [
    props.token,
    props.speakerName,
    props.bishopricParticipants,
    twilio.identity,
    user?.photoURL,
    user?.displayName,
    authors,
  ]);

  async function ensureReady(): Promise<boolean> {
    if (!user) await signIn();
    const current = useAuthStore.getState().user;
    if (!current) return false;
    if (twilio.status === "idle" || twilio.status === "error") {
      await twilio.connect({ wardId: props.wardId, invitationToken: props.token });
    }
    return true;
  }

  async function submitResponse(answer: "yes" | "no", reason?: string): Promise<void> {
    const current = useAuthStore.getState().user;
    if (!current || !current.email) throw new Error("Not signed in.");
    await writeSpeakerResponse({
      wardId: props.wardId,
      token: props.token,
      answer,
      ...(reason ? { reason } : {}),
      actorUid: current.uid,
      actorEmail: current.email,
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
          Each message shows the sender's name.
          {user?.email && (
            <span className="ml-2">
              Signed in as <strong>{user.email}</strong>
            </span>
          )}
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
