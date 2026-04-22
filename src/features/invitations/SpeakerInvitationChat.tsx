import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { PhoneAuthDialog } from "./PhoneAuthDialog";
import { QuickActionButtons } from "./QuickActionButtons";
import { useConversation, type AuthorInfo, type AuthorMap } from "./useConversation";
import { useSpeakerAuthGate } from "./useSpeakerAuthGate";
import { useTwilioChat } from "./twilioClientProvider";
import { writeSpeakerResponse } from "./invitationActions";

interface Props {
  wardId: string;
  token: string;
  conversationSid: string;
  speakerName: string;
  /** Pre-fills the phone-auth dialog input + matched against the
   *  invitation's speakerPhone server-side. */
  speakerPhone?: string | undefined;
  bishopricParticipants: readonly {
    uid: string;
    displayName: string;
    role: "bishopric" | "clerk";
    email?: string | undefined;
  }[];
  hasResponse: boolean;
}

/** Speaker-side chat pane. Phone-auth gates every write: taps on
 *  Yes / No / Send pop <PhoneAuthDialog>; once the speaker verifies
 *  their phone, the queued action resumes and Twilio connects with
 *  a phone-scoped JWT. */
export function SpeakerInvitationChat(props: Props): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const twilio = useTwilioChat();
  const { messages, conversation, authors, loading } = useConversation(props.conversationSid);
  const gate = useSpeakerAuthGate({ requestAuth: () => gate.openDialog() });

  const resolvedAuthors: AuthorMap = useMemo(() => {
    const map = new Map<string, AuthorInfo>();
    map.set(`speaker:${props.token}`, { displayName: props.speakerName, role: "speaker" });
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
      if (user.phoneNumber) info.email = user.phoneNumber;
      map.set(twilio.identity, info);
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
    user,
    authors,
  ]);

  useEffect(() => {
    if (twilio.status !== "ready" || !conversation || !user?.phoneNumber) return;
    const identity = `speaker:${props.token}`;
    (async () => {
      try {
        const p = await conversation.getParticipantByIdentity(identity);
        if (!p) return;
        const existing = (p.attributes as Record<string, unknown> | null) ?? {};
        await p.updateAttributes({
          ...existing,
          displayName: props.speakerName,
          role: "speaker",
          email: user.phoneNumber,
        });
      } catch {
        /* Non-fatal — fallback chain covers this. */
      }
    })();
  }, [twilio.status, conversation, user, props.token, props.speakerName]);

  async function ensureReady(): Promise<boolean> {
    const ok = await gate.ensureAuthed();
    if (!ok) return false;
    if (twilio.status === "idle" || twilio.status === "error") {
      await twilio.connect({ wardId: props.wardId, invitationToken: props.token });
    }
    return true;
  }

  async function submitResponse(answer: "yes" | "no", reason?: string): Promise<void> {
    const current = useAuthStore.getState().user;
    if (!current?.phoneNumber) throw new Error("Phone not verified.");
    await writeSpeakerResponse({
      wardId: props.wardId,
      token: props.token,
      answer,
      ...(reason ? { reason } : {}),
      actorUid: current.uid,
      actorPhone: current.phoneNumber,
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
          Verify your phone on first reply; the number you confirm must match the one this
          invitation was sent to.
          {user?.phoneNumber && (
            <span className="ml-2">
              Verified as <strong>{user.phoneNumber}</strong>
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

      <PhoneAuthDialog
        open={gate.dialogOpen}
        defaultPhone={props.speakerPhone}
        onClose={gate.closeDialog}
        onVerified={gate.handleVerified}
      />
    </section>
  );
}
