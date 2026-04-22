import { useEffect, useState } from "react";
import type { Conversation, Message } from "@twilio/conversations";
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

interface ConversationState {
  loading: boolean;
  messages: ChatMessage[];
  conversation: Conversation | null;
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

/** Subscribes to a single conversation's message stream. Returns
 *  { loading, messages, conversation, error }. Client must already be
 *  connected via <TwilioChatProvider> — this hook no-ops while the
 *  connection state is anything other than `ready`. */
export function useConversation(conversationSid: string | null): ConversationState {
  const { client, status } = useTwilioChat();
  const [state, setState] = useState<ConversationState>({
    loading: true,
    messages: [],
    conversation: null,
    error: null,
  });

  useEffect(() => {
    if (!client || status !== "ready" || !conversationSid) return;
    let cancelled = false;
    let convo: Conversation | null = null;
    const onMessageAdded = (m: Message) => {
      setState((s) => ({ ...s, messages: [...s.messages, toChatMessage(m)] }));
    };

    (async () => {
      try {
        convo = await client.getConversationBySid(conversationSid);
        if (cancelled) return;
        const page = await convo.getMessages(50);
        if (cancelled) return;
        setState({
          loading: false,
          messages: page.items.map(toChatMessage),
          conversation: convo,
          error: null,
        });
        convo.on("messageAdded", onMessageAdded);
      } catch (err) {
        if (cancelled) return;
        setState({ loading: false, messages: [], conversation: null, error: err as Error });
      }
    })();

    return () => {
      cancelled = true;
      if (convo) convo.off("messageAdded", onMessageAdded);
    };
  }, [client, status, conversationSid]);

  return state;
}
