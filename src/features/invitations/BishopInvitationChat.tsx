import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import type { SpeakerInvitation } from "@/lib/types";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { applyResponseToSpeaker } from "./invitationActions";
import { useConversation } from "./useConversation";
import { useTwilioChat } from "./twilioClientProvider";

interface Props {
  wardId: string;
  token: string;
  invitation: SpeakerInvitation;
}

/** Bishop-side conversation pane rendered on the Prepare Invitation
 *  page after an invitation has been sent. Auto-connects the Twilio
 *  client on mount. Above the thread, a Response strip surfaces the
 *  speaker's Yes/No reply (when they've submitted one) with an
 *  Apply button that writes speaker.status + stamps acknowledgement. */
export function BishopInvitationChat({ wardId, token, invitation }: Props): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const twilio = useTwilioChat();
  const { messages, conversation, loading } = useConversation(invitation.conversationSid ?? null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (twilio.status === "idle") void twilio.connect({ wardId });
  }, [twilio, wardId]);

  async function onApply() {
    if (!user) return;
    setApplying(true);
    setApplyError(null);
    try {
      await applyResponseToSpeaker({ wardId, token, bishopUid: user.uid });
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

interface StripProps {
  response: NonNullable<SpeakerInvitation["response"]>;
  needsApply: boolean;
  applying: boolean;
  onApply: () => void;
  error: string | null;
}

function ResponseStrip({ response, needsApply, applying, onApply, error }: StripProps) {
  const target = response.answer === "yes" ? "confirmed" : "declined";
  return (
    <div className="px-4 py-3 border-b border-border bg-parchment-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
            Response · {response.answer === "yes" ? "Yes" : "No"}
          </span>
          {response.reason && (
            <p className="font-serif italic text-[12.5px] text-walnut-2 mt-0.5">
              "{response.reason}"
            </p>
          )}
        </div>
        {needsApply ? (
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep disabled:opacity-60 shrink-0"
          >
            {applying ? "Applying…" : `Apply as ${target}`}
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Applied · status is {target}
          </span>
        )}
      </div>
      {error && <p className="font-sans text-[11.5px] text-bordeaux mt-1.5">{error}</p>}
    </div>
  );
}
