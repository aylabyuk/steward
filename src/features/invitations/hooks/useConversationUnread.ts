import { useEffect, useState } from "react";
import type { Conversation } from "@twilio/conversations";
import { useTwilioChat } from "../TwilioChatProvider";

/** Per-conversation unread badge signal. Returns the unread
 *  message count for `conversationSid` as seen by the currently-
 *  connected Twilio participant. null when the client isn't
 *  connected yet, when the sid is missing, or when Twilio doesn't
 *  have a read horizon recorded for the participant yet. Re-fetches
 *  on messageAdded / updatedLastReadMessageIndex so the badge reacts
 *  live to fresh replies arriving and to the local participant
 *  advancing their read horizon. */
export function useConversationUnread(conversationSid: string | null | undefined): number | null {
  const { client, status } = useTwilioChat();
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    if (!client || status !== "ready" || !conversationSid) {
      setUnread(null);
      return;
    }
    let cancelled = false;
    let convoRef: Conversation | null = null;
    let handlerRef: (() => void) | null = null;

    async function refetch(convo: Conversation) {
      const count = await convo.getUnreadMessagesCount();
      if (cancelled) return;
      // Twilio returns null when the participant has never marked
      // anything read (no read horizon set). In that case, every
      // message in the conversation is effectively unread — derive
      // the count from lastMessage.index. Without this, the badge
      // never lights up on a brand-new conversation.
      if (count !== null) {
        setUnread(count);
        return;
      }
      const lastIdx = convo.lastMessage?.index;
      setUnread(typeof lastIdx === "number" ? lastIdx + 1 : 0);
    }

    (async () => {
      try {
        const convo = await client.getConversationBySid(conversationSid);
        if (cancelled) return;
        convoRef = convo;
        await refetch(convo);
        const handler = () => {
          void refetch(convo);
        };
        handlerRef = handler;
        // participantUpdated fires reliably when the LOCAL participant
        // advances their own last-read index (setAllMessagesRead).
        // updatedLastReadMessageIndex is inconsistent about self-fire
        // across SDK versions, so we depend on participantUpdated for
        // the read-horizon signal and keep messageAdded for fresh
        // incoming messages.
        convo.on("messageAdded", handler);
        convo.on("participantUpdated", handler);
      } catch {
        if (!cancelled) setUnread(null);
      }
    })();

    // Detach ONLY the handler this hook added. Using
    // removeAllListeners on a shared conversation would clobber other
    // subscribers (e.g. useConversation's own messageAdded hookup)
    // and silently break them on drawer close.
    return () => {
      cancelled = true;
      if (convoRef && handlerRef) {
        convoRef.off("messageAdded", handlerRef);
        convoRef.off("participantUpdated", handlerRef);
      }
    };
  }, [client, status, conversationSid]);

  return unread;
}
