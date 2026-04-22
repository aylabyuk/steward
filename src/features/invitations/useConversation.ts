import { useEffect, useState } from "react";
import type { Conversation, Message, Participant } from "@twilio/conversations";
import { useTwilioChat } from "./twilioClientProvider";

export interface ChatMessage {
  sid: string;
  index: number;
  author: string;
  body: string;
  dateCreated: Date | null;
  /** Parsed attributes — `{ responseType: 'yes' | 'no', reason? }`
   *  for the structured quick-action messages, `{ kind: 'invitation' }`
   *  for the initial letter, else null. */
  attributes: Record<string, unknown> | null;
}

export interface AuthorInfo {
  displayName: string;
  role?: "speaker" | "bishopric" | "clerk";
}

/** Map keyed by participant identity (e.g. `uid:abc123`,
 *  `speaker:{token}`). Used by the thread to render bubble labels +
 *  avatar initials without knowing individual participants at the
 *  call site. */
export type AuthorMap = Map<string, AuthorInfo>;

interface ConversationState {
  loading: boolean;
  messages: ChatMessage[];
  conversation: Conversation | null;
  authors: AuthorMap;
  error: Error | null;
}

function toChatMessage(m: Message): ChatMessage {
  let attributes: Record<string, unknown> | null = null;
  const raw = m.attributes;
  if (raw && typeof raw === "object") attributes = raw as Record<string, unknown>;
  return {
    sid: m.sid,
    index: m.index,
    author: m.author ?? "",
    body: m.body ?? "",
    dateCreated: m.dateCreated ?? null,
    attributes,
  };
}

function parseAuthorInfo(p: Participant): AuthorInfo | null {
  const attrs = p.attributes as { displayName?: string; role?: AuthorInfo["role"] } | null;
  if (!attrs?.displayName) return null;
  return attrs.role ? { displayName: attrs.displayName, role: attrs.role } : { displayName: attrs.displayName };
}

/** Subscribes to a single conversation's message stream and loads
 *  the participants' display-name map. Client must already be
 *  connected via <TwilioChatProvider>. */
export function useConversation(conversationSid: string | null): ConversationState {
  const { client, status } = useTwilioChat();
  const [state, setState] = useState<ConversationState>({
    loading: true,
    messages: [],
    conversation: null,
    authors: new Map(),
    error: null,
  });

  useEffect(() => {
    if (!client || status !== "ready" || !conversationSid) return;
    let cancelled = false;
    let convo: Conversation | null = null;
    const onMessageAdded = (m: Message) => {
      setState((s) => ({ ...s, messages: [...s.messages, toChatMessage(m)] }));
    };
    const onParticipantUpdate = (p: Participant) => {
      setState((s) => {
        if (!p.identity) return s;
        const info = parseAuthorInfo(p);
        if (!info) return s;
        const next = new Map(s.authors);
        next.set(p.identity, info);
        return { ...s, authors: next };
      });
    };

    (async () => {
      try {
        convo = await client.getConversationBySid(conversationSid);
        if (cancelled) return;
        const [page, participants] = await Promise.all([
          convo.getMessages(50),
          convo.getParticipants(),
        ]);
        if (cancelled) return;
        const authors: AuthorMap = new Map();
        for (const p of participants) {
          if (!p.identity) continue;
          const info = parseAuthorInfo(p);
          if (info) authors.set(p.identity, info);
        }
        setState({
          loading: false,
          messages: page.items.map(toChatMessage),
          conversation: convo,
          authors,
          error: null,
        });
        convo.on("messageAdded", onMessageAdded);
        convo.on("participantJoined", onParticipantUpdate);
        convo.on("participantUpdated", (args) => onParticipantUpdate(args.participant));
      } catch (err) {
        if (cancelled) return;
        setState({
          loading: false,
          messages: [],
          conversation: null,
          authors: new Map(),
          error: err as Error,
        });
      }
    })();

    return () => {
      cancelled = true;
      if (convo) {
        convo.removeAllListeners("messageAdded");
        convo.removeAllListeners("participantJoined");
        convo.removeAllListeners("participantUpdated");
      }
    };
  }, [client, status, conversationSid]);

  return state;
}
