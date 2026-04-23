import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SundayInvitationsSummary {
  /** At least one speaker has a recorded `response` that the bishop
   *  hasn't yet applied to `speaker.status`. Drives the brass-dot
   *  badge on the Sunday card header. */
  needsApply: boolean;
}

/** Live-query the `speakerInvitations` for a single Sunday and
 *  return a compact summary for UI badges. One subscription per
 *  visible Sunday on the schedule (typically 4).
 *
 *  Unread-message counts would also belong here, but they live in
 *  Twilio, not Firestore — computing them requires a chat client
 *  connection per Sunday which is too heavy for a schedule-level
 *  badge. Filed as follow-up; v1 only surfaces the needs-apply
 *  signal. */
export function useSundayInvitationsSummary(
  wardId: string | null,
  meetingDate: string | null,
): SundayInvitationsSummary {
  const [summary, setSummary] = useState<SundayInvitationsSummary>({ needsApply: false });

  useEffect(() => {
    if (!wardId || !meetingDate) {
      setSummary({ needsApply: false });
      return;
    }
    const q = query(
      collection(db, "wards", wardId, "speakerInvitations"),
      where("speakerRef.meetingDate", "==", meetingDate),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        let needsApply = false;
        for (const d of snap.docs) {
          const data = d.data() as DocumentData;
          const response = data.response as { acknowledgedAt?: unknown } | undefined;
          if (response && !response.acknowledgedAt) {
            needsApply = true;
            break;
          }
        }
        setSummary({ needsApply });
      },
      () => setSummary({ needsApply: false }),
    );
    return () => unsub();
  }, [wardId, meetingDate]);

  return summary;
}
