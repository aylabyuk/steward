import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Message, Participant } from "@twilio/conversations";
import { parseAuthorInfo, toChatMessage } from "./conversationHelpers";
import { readReactions, toggleReaction as toggleReactionMap } from "./reactions";
import { useTwilioChat } from "./twilioClientProvider";

export interface ChatMessage {
  sid: string;
  index: number;
  author: string;
  body: string;
  dateCreated: Date | null;
  /** Parsed attributes — `{ responseType: 'yes' | 'no', reason? }`
   *  for the structured quick-action messages, `{ kind: 'invitation' }`
   *  for the initial letter, `{ reactions: { emoji: [id...] } }` when
   *  anyone has reacted, else null. */
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

export interface ConversationHookResult extends ConversationState {
  /** Toggles the caller's identity on a reaction emoji for a given
   *  message. Writes the new attributes to Twilio; the messageUpdated
   *  event then refreshes local state for everyone. */
  toggleReaction: (sid: string, emoji: string, identity: string) => Promise<void>;
}

/** Subscribes to a single conversation's message stream, participant
 *  list, and message-attribute updates (so reactions stay live).
 *  Client must already be connected via <TwilioChatProvider>. */
export function useConversation(conversationSid: string | null): ConversationHookResult {
  const { client, status } = useTwilioChat();
  const [state, setState] = useState<ConversationState>({
    loading: true,
    messages: [],
    conversation: null,
    authors: new Map(),
    error: null,
  });
  const msgRefs = useRef<Map<string, Message>>(new Map());

  useEffect(() => {
    if (!client || status !== "ready" || !conversationSid) return;
    let cancelled = false;
    let convo: Conversation | null = null;
    msgRefs.current = new Map();
    const replaceMessage = (m: Message) =>
      setState((s) => ({
        ...s,
        messages: s.messages.map((x) => (x.sid === m.sid ? toChatMessage(m) : x)),
      }));
    const onMessageAdded = (m: Message) => {
      msgRefs.current.set(m.sid, m);
      setState((s) => ({ ...s, messages: [...s.messages, toChatMessage(m)] }));
    };
    const onMessageUpdated = (args: { message: Message }) => {
      msgRefs.current.set(args.message.sid, args.message);
      replaceMessage(args.message);
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
        for (const m of page.items) msgRefs.current.set(m.sid, m);
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
        convo.on("messageUpdated", onMessageUpdated);
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
        convo.removeAllListeners("messageUpdated");
        convo.removeAllListeners("participantJoined");
        convo.removeAllListeners("participantUpdated");
      }
    };
  }, [client, status, conversationSid]);

  const toggleReaction = useCallback(
    async (sid: string, emoji: string, identity: string): Promise<void> => {
      const msg = msgRefs.current.get(sid);
      if (!msg) return;
      const current = readReactions(
        msg.attributes && typeof msg.attributes === "object"
          ? (msg.attributes as Record<string, unknown>)
          : null,
      );
      const nextReactions = toggleReactionMap(current, emoji, identity);
      const rawAttrs =
        msg.attributes && typeof msg.attributes === "object"
          ? (msg.attributes as Record<string, unknown>)
          : {};
      await msg.updateAttributes({ ...rawAttrs, reactions: nextReactions });
    },
    [],
  );

  return { ...state, toggleReaction };
}
