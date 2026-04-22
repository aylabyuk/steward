import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { speakerInvitationSchema, type SpeakerInvitation } from "@/lib/types";

export type SpeakerInvitationState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; invitation: SpeakerInvitation };

/**
 * Live public read of a speaker invitation by its token doc ID.
 * Letter content is frozen, but the `response` subtree updates as
 * the speaker taps Yes/No and the bishop acknowledges — the live
 * subscription keeps both sides of the chat pane reactive.
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
    const unsub = onSnapshot(
      doc(db, "wards", wardId, "speakerInvitations", token),
      (snap) => {
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
      },
      (err) => setState({ kind: "error", message: err.message }),
    );
    return () => unsub();
  }, [wardId, token]);

  return state;
}
