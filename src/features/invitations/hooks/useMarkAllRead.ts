import { useEffect } from "react";
import type { Conversation } from "@twilio/conversations";

/** Bumps the local participant's last-read horizon to the latest
 *  message in the conversation whenever `trigger` changes (typically
 *  the loaded message count). Used by the bishop's chat dialog to
 *  clear the Sunday-card unread badge as messages land while the
 *  thread is open.
 *
 *  Awaited (not fire-and-forget) so a Twilio rejection — e.g. the
 *  bishop participant hasn't backfilled yet via issueSpeakerSession,
 *  or a transient REST failure — surfaces as a console warning
 *  instead of silently leaving the badge lit. */
export function useMarkAllRead(conversation: Conversation | null, trigger: number): void {
  useEffect(() => {
    if (!conversation || trigger === 0) return;
    let cancelled = false;
    (async () => {
      try {
        await conversation.setAllMessagesRead();
      } catch (err) {
        if (!cancelled) console.warn("setAllMessagesRead failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversation, trigger]);
}
