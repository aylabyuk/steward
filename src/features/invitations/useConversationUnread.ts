import { useEffect, useState } from "react";
import type { Conversation } from "@twilio/conversations";
import { useTwilioChat } from "./twilioClientProvider";

/** Per-conversation unread badge signal. Returns the unread
 *  message count for `conversationSid` as seen by the currently-
 *  connected Twilio participant (i.e., the bishop). null when the
 *  client isn't connected yet, when the sid is missing, or when
 *  Twilio doesn't have a read horizon recorded for the participant
 *  yet. Re-fetches on messageAdded so the badge reacts live to new
 *  speaker replies arriving. */
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

    async function refetch(convo: Conversation) {
      const count = await convo.getUnreadMessagesCount();
      if (!cancelled) setUnread(count);
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
        convo.on("messageAdded", handler);
        convo.on("updatedLastReadMessageIndex", handler);
      } catch {
        if (!cancelled) setUnread(null);
      }
    })();

    return () => {
      cancelled = true;
      if (convoRef) {
        convoRef.removeAllListeners("messageAdded");
        convoRef.removeAllListeners("updatedLastReadMessageIndex");
      }
    };
  }, [client, status, conversationSid]);

  return unread;
}
