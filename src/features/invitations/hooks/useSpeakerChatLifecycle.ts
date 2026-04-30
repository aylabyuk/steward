import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { Conversation } from "@twilio/conversations";
import { inviteAuth } from "@/lib/firebase";
import type { useTwilioChat } from "../TwilioChatProvider";
import { useSpeakerHeartbeat } from "./useSpeakerHeartbeat";

interface Args {
  wardId: string;
  invitationId: string;
  conversation: Conversation | null;
  messageCount: number;
  twilio: ReturnType<typeof useTwilioChat>;
}

/** Bundles the three side effects the speaker chat needs at mount:
 *  Firebase Auth state subscription on the isolated invite app,
 *  speaker heartbeat doc, Twilio client auto-connect, and the
 *  mark-all-read horizon bump whenever new messages land. Pulled out
 *  of `SpeakerInvitationChat` to keep that file under the 150-line
 *  cap. */
export function useSpeakerChatLifecycle({
  wardId,
  invitationId,
  conversation,
  messageCount,
  twilio,
}: Args): User | null {
  const [user, setUser] = useState<User | null>(inviteAuth.currentUser);

  useEffect(() => onAuthStateChanged(inviteAuth, setUser), []);

  useSpeakerHeartbeat({ wardId, invitationId, enabled: Boolean(user) });

  useEffect(() => {
    if (twilio.status !== "idle") return;
    void twilio.connect({ wardId, invitationId, useInviteApp: true });
  }, [twilio, wardId, invitationId]);

  useEffect(() => {
    if (!conversation || messageCount === 0) return;
    void conversation.setAllMessagesRead();
  }, [conversation, messageCount]);

  return user;
}
