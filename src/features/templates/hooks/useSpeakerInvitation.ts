import { useEffect, useState } from "react";
import { doc, onSnapshot, type Firestore } from "firebase/firestore";
import { db, inviteDb } from "@/lib/firebase";
import { speakerInvitationSchema, type SpeakerInvitation } from "@/lib/types";

export type SpeakerInvitationState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; invitation: SpeakerInvitation };

/**
 * Live public read of a speaker invitation by its doc ID. Letter
 * content is frozen, but the `response` subtree updates as the
 * speaker taps Yes/No and the bishop acknowledges — the live
 * subscription keeps both sides of the chat pane reactive.
 *
 * Callers on the invite landing page must pass `useInviteApp: true`
 * so the read goes through the isolated `inviteDb` (bound to
 * `inviteAuth`). Main-app readers (Prepare page, etc.) omit the
 * option and go through the default `db`.
 */
export function useSpeakerInvitation(
  wardId: string | undefined,
  invitationId: string | undefined,
  options: { useInviteApp?: boolean } = {},
): SpeakerInvitationState {
  const [state, setState] = useState<SpeakerInvitationState>({ kind: "loading" });
  const target: Firestore = options.useInviteApp ? inviteDb : db;

  useEffect(() => {
    if (!wardId || !invitationId) {
      setState({ kind: "not-found" });
      return;
    }
    const unsub = onSnapshot(
      doc(target, "wards", wardId, "speakerInvitations", invitationId),
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
  }, [wardId, invitationId, target]);

  return state;
}
