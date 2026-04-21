import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { speakerInvitationSchema, type SpeakerInvitation } from "@/lib/types";

export type SpeakerInvitationState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; invitation: SpeakerInvitation };

/**
 * One-shot public read of a speaker invitation by its token doc ID.
 * Not a live subscription — the letter content is a frozen snapshot,
 * so a single fetch is correct.
 */
export function useSpeakerInvitation(
  wardId: string | undefined,
  token: string | undefined,
): SpeakerInvitationState {
  const [state, setState] = useState<SpeakerInvitationState>({ kind: "loading" });

  useEffect(() => {
    if (!wardId || !token) {
      setState({ kind: "not-found" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "wards", wardId, "speakerInvitations", token));
        if (cancelled) return;
        if (!snap.exists()) {
          setState({ kind: "not-found" });
          return;
        }
        const parsed = speakerInvitationSchema.safeParse(snap.data());
        if (!parsed.success) {
          setState({ kind: "error", message: "Invitation is malformed." });
          return;
        }
        setState({ kind: "ready", invitation: parsed.data });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: "error", message: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wardId, token]);

  return state;
}
