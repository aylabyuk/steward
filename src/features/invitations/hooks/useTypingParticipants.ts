import { useEffect, useState } from "react";
import type { Conversation, Participant } from "@twilio/conversations";

/** Subscribes to typingStarted / typingEnded events on a Twilio
 *  conversation and returns the set of currently-typing participant
 *  identities (excluding the caller's own identity when provided so
 *  the UI never shows "you are typing"). */
export function useTypingParticipants(
  conversation: Conversation | null,
  selfIdentity: string | null,
): readonly string[] {
  const [typing, setTyping] = useState<readonly string[]>([]);

  useEffect(() => {
    if (!conversation) {
      setTyping([]);
      return;
    }
    const add = (p: Participant) => {
      if (!p.identity || p.identity === selfIdentity) return;
      setTyping((prev) => (prev.includes(p.identity!) ? prev : [...prev, p.identity!]));
    };
    const remove = (p: Participant) => {
      if (!p.identity) return;
      setTyping((prev) => prev.filter((id) => id !== p.identity));
    };
    conversation.on("typingStarted", add);
    conversation.on("typingEnded", remove);
    return () => {
      conversation.off("typingStarted", add);
      conversation.off("typingEnded", remove);
    };
  }, [conversation, selfIdentity]);

  return typing;
}
