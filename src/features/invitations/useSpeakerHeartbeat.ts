import { useEffect } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { inviteDb } from "@/lib/firebase";

const HEARTBEAT_INTERVAL_MS = 60_000;

/** Speaker-side presence heartbeat. Writes `speakerLastSeenAt` on the
 *  invitation doc every 60s while the tab is visible, and on every
 *  visibilitychange → visible transition. The bishop-reply webhook
 *  reads this to skip the SMS-with-resume-link when the speaker is
 *  looking at the chat live.
 *
 *  Errors are swallowed: if the heartbeat write fails the speaker
 *  falls back to being treated as offline, which is the safe default
 *  (they receive the SMS they'd have gotten anyway). */
export function useSpeakerHeartbeat({
  wardId,
  invitationId,
  enabled,
}: {
  wardId: string;
  invitationId: string;
  enabled: boolean;
}): void {
  useEffect(() => {
    if (!enabled) return;
    const ref = doc(inviteDb, "wards", wardId, "speakerInvitations", invitationId);
    const ping = () => {
      void updateDoc(ref, { speakerLastSeenAt: serverTimestamp() }).catch(() => {});
    };
    ping();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") ping();
    }, HEARTBEAT_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [wardId, invitationId, enabled]);
}
