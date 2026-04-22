import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { speakerInvitationSchema, type SpeakerInvitation } from "@/lib/types";

export interface LatestInvitationState {
  loading: boolean;
  /** Most-recently-sent invitation for this speaker on this date, or
   *  null when none has been sent yet. */
  invitation: (SpeakerInvitation & { token: string }) | null;
}

/** Live query for the most recent `speakerInvitations` doc pointing
 *  at the given (meetingDate, speakerId) pair. Used by the Prepare
 *  page to conditionally mount the chat pane once an invitation has
 *  been sent. Each resend creates a new doc — we always show the
 *  latest. */
export function useLatestInvitation(
  wardId: string | null,
  meetingDate: string | null,
  speakerId: string | null,
): LatestInvitationState {
  const [state, setState] = useState<LatestInvitationState>({ loading: true, invitation: null });

  useEffect(() => {
    if (!wardId || !meetingDate || !speakerId) {
      setState({ loading: false, invitation: null });
      return;
    }
    const q = query(
      collection(db, "wards", wardId, "speakerInvitations"),
      where("speakerRef.meetingDate", "==", meetingDate),
      where("speakerRef.speakerId", "==", speakerId),
      orderBy("createdAt", "desc"),
      limit(1),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setState({ loading: false, invitation: null });
          return;
        }
        const d = snap.docs[0]!;
        const parsed = speakerInvitationSchema.safeParse(d.data() as DocumentData);
        if (!parsed.success) {
          setState({ loading: false, invitation: null });
          return;
        }
        setState({ loading: false, invitation: { ...parsed.data, token: d.id } });
      },
      () => setState({ loading: false, invitation: null }),
    );
    return () => unsub();
  }, [wardId, meetingDate, speakerId]);

  return state;
}
