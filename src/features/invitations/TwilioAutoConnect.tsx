import { useEffect } from "react";
import { useTwilioChat } from "./TwilioChatProvider";

interface Props {
  wardId: string;
}

/** Auto-connects the Twilio Conversations client when a wardId is
 *  available. Needed for schedule-level affordances (per-speaker
 *  unread badges) that query Twilio without the bishop having to
 *  open a dialog first. Idempotent — does nothing if the client is
 *  already connecting / ready. */
export function TwilioAutoConnect({ wardId }: Props): null {
  const { status, connect } = useTwilioChat();
  useEffect(() => {
    if (!wardId) return;
    if (status !== "idle") return;
    void connect({ wardId });
  }, [wardId, status, connect]);
  return null;
}
