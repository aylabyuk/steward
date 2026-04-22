import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { QuickActionButtons } from "./QuickActionButtons";
import { useConversation } from "./useConversation";
import { useTwilioChat } from "./twilioClientProvider";
import { writeSpeakerResponse } from "./invitationActions";

interface Props {
  wardId: string;
  token: string;
  conversationSid: string;
  speakerEmail?: string | undefined;
  /** True when the invitation already has a response recorded. Quick
   *  actions are hidden, composer stays available for ongoing chat. */
  hasResponse: boolean;
}

/** Speaker-side chat pane: sign-in + email-match on first write,
 *  then plain chat with optional Yes/No quick actions until a
 *  response is recorded. */
export function SpeakerInvitationChat(props: Props): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);
  const twilio = useTwilioChat();
  const { messages, conversation, loading } = useConversation(props.conversationSid);
  const [mismatch, setMismatch] = useState<string | null>(null);

  async function ensureReady(): Promise<boolean> {
    setMismatch(null);
    if (!user) await signIn();
    const current = useAuthStore.getState().user;
    if (!current) return false;
    const authEmail = current.email?.toLowerCase() ?? "";
    if (props.speakerEmail && authEmail !== props.speakerEmail.toLowerCase()) {
      setMismatch(maskEmail(props.speakerEmail));
      return false;
    }
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
          Messages are private between you and the bishopric.
          {user && user.email && (
            <span className="ml-2">
              Signed in as <strong>{user.email}</strong>
            </span>
          )}
        </p>
      </header>

      {mismatch && (
        <div className="px-4 py-3 bg-danger-soft border-b border-border">
          <p className="font-sans text-[12.5px] text-bordeaux">
            This invitation is addressed to {mismatch}. Sign in with that Google account.
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              await twilio.disconnect();
              setMismatch(null);
            }}
            className="mt-1 font-sans text-[12.5px] font-semibold text-bordeaux-deep underline"
          >
            Sign in with a different account
          </button>
        </div>
      )}

      <ConversationThread
        messages={messages}
        currentIdentity={twilio.identity}
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

function maskPart(s: string): string {
  return s.length <= 2 ? s : `${s[0]}${"*".repeat(s.length - 2)}${s.at(-1)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${maskPart(local)}@${maskPart(domain)}`;
}
