import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { speakerInvitationSchema, type SpeakerInvitation } from "@/lib/types";

export interface LatestInvitationState {
  loading: boolean;
  /** Most-recently-sent invitation for this speaker on this date, or
   *  null when none has been sent yet. */
  invitation: (SpeakerInvitation & { token: string }) | null;
}

/** Live query for the most recent `speakerInvitations` doc pointing
 *  at the given (meetingDate, speakerId) pair.
 *
 *  Implementation note: we filter only by `speakerRef.meetingDate`
 *  server-side (a single-field where — no composite index needed),
 *  then pick the right speaker + newest createdAt client-side. The
 *  previous orderBy-on-createdAt + two-field-where combo required a
 *  composite index that wasn't deployed; the query failed silently
 *  and the hook returned null for every speaker. Keeping this
 *  client-filtered is cheap — a Sunday has ~2–4 invitation docs
 *  typically, even with resends. */
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
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const candidates = snap.docs
          .map((d) => ({ id: d.id, data: d.data() as DocumentData }))
          .filter((d) => (d.data.speakerRef as { speakerId: string } | undefined)?.speakerId === speakerId);
        if (candidates.length === 0) {
          setState({ loading: false, invitation: null });
          return;
        }
        candidates.sort((a, b) => millisOf(b.data.createdAt) - millisOf(a.data.createdAt));
        const chosen = candidates[0]!;
        const parsed = speakerInvitationSchema.safeParse(chosen.data);
        if (!parsed.success) {
          setState({ loading: false, invitation: null });
          return;
        }
        setState({ loading: false, invitation: { ...parsed.data, token: chosen.id } });
      },
      (err) => {
        console.error("useLatestInvitation snapshot error", err);
        setState({ loading: false, invitation: null });
      },
    );
    return () => unsub();
  }, [wardId, meetingDate, speakerId]);

  return state;
}

function millisOf(v: unknown): number {
  if (v && typeof v === "object" && "toMillis" in v && typeof v.toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}
