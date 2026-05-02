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
 * Live read of a speaker invitation by its doc ID, returning the
 * merged shape (public parent + private auth subdoc post C1
 * doc-split). Both halves are subscribed via `onSnapshot` and
 * combined in state — the public half is always loaded; the auth
 * subscription resolves only when the caller is authorized to read
 * it (the speaker post-issueSpeakerSession with the matching
 * `invitationId` claim, or a bishopric/clerk on `db`). When the auth
 * read is denied the public part still renders — the landing page's
 * pre-auth letter view depends on this.
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
    let publicData: Record<string, unknown> | null = null;
    let authData: Record<string, unknown> = {};
    const emit = () => {
      if (publicData === null) return;
      const merged = { ...publicData, ...authData };
      const parsed = speakerInvitationSchema.safeParse(merged);
      if (!parsed.success) {
        setState({ kind: "error", message: "Invitation is malformed." });
        return;
      }
      setState({ kind: "ready", invitation: parsed.data });
    };
    const parentRef = doc(target, "wards", wardId, "speakerInvitations", invitationId);
    const authRef = doc(parentRef, "private", "auth");
    const unsubPublic = onSnapshot(
      parentRef,
      (snap) => {
        if (!snap.exists()) {
          setState({ kind: "not-found" });
          publicData = null;
          return;
        }
        publicData = snap.data();
        emit();
      },
      (err) => setState({ kind: "error", message: err.message }),
    );
    const unsubAuth = onSnapshot(
      authRef,
      (snap) => {
        authData = snap.exists() ? (snap.data() ?? {}) : {};
        emit();
      },
      // Auth subdoc reads can fail with permission-denied for
      // anonymous landing-page viewers — that's expected; keep the
      // public-only render alive instead of bubbling up an error.
      () => {
        authData = {};
        emit();
      },
    );
    return () => {
      unsubPublic();
      unsubAuth();
    };
  }, [wardId, invitationId, target]);

  return state;
}
