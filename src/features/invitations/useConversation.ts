import { useEffect, useState } from "react";
import type { Conversation, Message, Participant } from "@twilio/conversations";
import { parseAuthorInfo, toChatMessage } from "./conversationHelpers";
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
  photoURL?: string;
  email?: string;
}

export type AuthorMap = Map<string, AuthorInfo>;

interface ConversationState {
  loading: boolean;
  messages: ChatMessage[];
  conversation: Conversation | null;
  authors: AuthorMap;
  error: Error | null;
}

export type ConversationHookResult = ConversationState;

/** Subscribes to a single conversation's message stream and
 *  participant list. Client must already be connected via
 *  <TwilioChatProvider>. */
export function useConversation(conversationSid: string | null): ConversationHookResult {
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
