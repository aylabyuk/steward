import { useEffect, useState } from "react";
import type { Conversation } from "@twilio/conversations";

/** Snapshots the first-unread Twilio message index at the moment the
 *  conversation loads, then pins it for the life of the sid. The
 *  thread uses this to place a "New" divider that doesn't drift as
 *  more incoming messages arrive in the same session.
 *
 *  Returns null when the participant is caught up (no unread), or
 *  when the conversation isn't resolved yet. */
export function useFirstUnreadIndex(conversation: Conversation | null): number | null {
  const [snapshot, setSnapshot] = useState<number | null>(null);

  useEffect(() => {
    if (!conversation) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const lastRead = conversation.lastReadMessageIndex;
      const lastMsgIdx = conversation.lastMessage?.index;
      if (typeof lastMsgIdx !== "number") {
        if (!cancelled) setSnapshot(null);
        return;
      }
      // Never read anything → entire conversation is unread, start at
      // message index 0. Otherwise start just after the read horizon.
      const first = lastRead === null ? 0 : lastRead + 1;
      if (!cancelled) setSnapshot(first <= lastMsgIdx ? first : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversation]);

  return snapshot;
}
