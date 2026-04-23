import { useEffect, useState } from "react";
import type { Conversation, Participant } from "@twilio/conversations";

/** Highest message index that any participant other than `self` has
 *  marked as read. The bishop side uses this to show a "Read" label
 *  once the speaker has caught up; the speaker side uses it to show
 *  that at least one bishopric member has seen their reply.
 *
 *  Returns null until participants have loaded or when no other
 *  participant has a read horizon recorded yet. */
export function useReadHorizon(
  conversation: Conversation | null,
  selfIdentity: string | null,
): number | null {
  const [horizon, setHorizon] = useState<number | null>(null);

  useEffect(() => {
    if (!conversation) {
      setHorizon(null);
      return;
    }
    let cancelled = false;
    const recomputeFrom = (participants: readonly Participant[]) => {
      let max: number | null = null;
      for (const p of participants) {
        if (!p.identity || p.identity === selfIdentity) continue;
        const idx = p.lastReadMessageIndex;
        if (typeof idx === "number" && (max === null || idx > max)) max = idx;
      }
      if (!cancelled) setHorizon(max);
    };
    (async () => {
      const ps = await conversation.getParticipants();
      if (!cancelled) recomputeFrom(ps);
    })();
    const onUpdate = () => {
      void conversation.getParticipants().then((ps) => {
        if (!cancelled) recomputeFrom(ps);
      });
    };
    conversation.on("participantUpdated", onUpdate);
    conversation.on("participantJoined", onUpdate);
    return () => {
      cancelled = true;
      conversation.off("participantUpdated", onUpdate);
      conversation.off("participantJoined", onUpdate);
    };
  }, [conversation, selfIdentity]);

  return horizon;
}
