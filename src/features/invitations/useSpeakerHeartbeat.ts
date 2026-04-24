import { useEffect } from "react";
import { doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { inviteDb } from "@/lib/firebase";

const HEARTBEAT_INTERVAL_MS = 60_000;
/** When the speaker hides / closes the tab we stamp
 *  `speakerLastSeenAt` this far into the past so the bishop-side
 *  banner's "viewing now" bucket (< 2 min) immediately falls over
 *  into "N min ago". Without this, the badge would linger for up to
 *  ~2 minutes after the speaker actually left. */
const STALE_OFFSET_MS = 3 * 60_000;

/** Speaker-side presence heartbeat. Writes `speakerLastSeenAt` on the
 *  invitation doc every 60s while the tab is visible, and on every
 *  visibilitychange → visible transition. The bishop-reply webhook
 *  reads this to skip the SMS-with-resume-link when the speaker is
 *  looking at the chat live.
 *
 *  On `pagehide` or `visibilitychange → hidden` we proactively
 *  backdate the heartbeat by 3 minutes — that way the bishop's
 *  "viewing now" badge clears within a refresh cycle, not at the end
 *  of the natural 2-min expiry window.
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
    const markOffline = () => {
      const staleAt = Timestamp.fromMillis(Date.now() - STALE_OFFSET_MS);
      void updateDoc(ref, { speakerLastSeenAt: staleAt }).catch(() => {});
    };
    ping();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") ping();
    }, HEARTBEAT_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") markOffline();
      else if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", markOffline);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", markOffline);
    };
  }, [wardId, invitationId, enabled]);
}
