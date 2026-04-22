import { useEffect, useMemo, useState } from "react";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useAuthStore } from "@/stores/authStore";
import type { SpeakerInvitation } from "@/lib/types";
import { ConversationComposer } from "./ConversationComposer";
import { ConversationThread } from "./ConversationThread";
import { applyResponseToSpeaker } from "./invitationActions";
import { useConversation, type AuthorInfo, type AuthorMap } from "./useConversation";
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
      map.set(`uid:${m.id}`, { displayName: m.data.displayName, role: m.data.role });
    }
    map.set(`speaker:${token}`, { displayName: invitation.speakerName, role: "speaker" });
    if (user?.uid && user.photoURL) {
      const existing = map.get(`uid:${user.uid}`);
      map.set(`uid:${user.uid}`, {
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
  }, [members.data, token, invitation.speakerName, user?.uid, user?.photoURL, user?.displayName, authors]);

  useEffect(() => {
    if (twilio.status === "idle") void twilio.connect({ wardId });
  }, [twilio, wardId]);

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
