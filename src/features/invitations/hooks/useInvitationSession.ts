import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithCustomToken, type User } from "firebase/auth";
import { inviteAuth } from "@/lib/firebase";
import { callIssueSpeakerSession } from "../utils/invitationsCallable";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; user: User; twilioToken: string; identity: string }
  | { kind: "rotated"; phoneLast4: string | null }
  | { kind: "rate-limited" }
  | { kind: "invalid" }
  | { kind: "error"; message: string };

interface SessionController {
  status: Status;
  /** Kicks off the exchange. The first render is `idle`; the landing
   *  page prompts "Tap to continue" so SMS-app prefetchers can't
   *  consume the token on a bare GET. */
  start: () => Promise<void>;
}

interface Args {
  wardId: string | undefined;
  invitationId: string | undefined;
  invitationToken: string | undefined;
}

/** Owns speaker-side Firebase Auth on the invite page. Uses the
 *  isolated `inviteAuth` so a bishopric Google session on the same
 *  device stays untouched. Does an `onAuthStateChanged` probe on mount
 *  — if a prior sign-in is still live (persisted across reloads), we
 *  skip the landing prompt and go straight to "ready". */
export function useInvitationSession({
  wardId,
  invitationId,
  invitationToken,
}: Args): SessionController {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const startedRef = useRef(false);

  useEffect(() => {
    // Short-circuit autorefresh if the speaker is already signed in
    // from a prior visit. Avoids burning the capability token on
    // page reloads. If the stored session's claim matches THIS
    // invitationId we reuse it; otherwise we fall back to the normal
    // tap-to-continue flow.
    const unsub = onAuthStateChanged(inviteAuth, async (user) => {
      if (!user || !wardId || !invitationId) return;
      const claims = await user.getIdTokenResult();
      if (claims.claims["invitationId"] !== invitationId) return;
      if (claims.claims["wardId"] !== wardId) return;
      try {
        setStatus({ kind: "loading" });
        const res = await callIssueSpeakerSession({ wardId, invitationId }, { useInviteApp: true });
        if (res.status !== "ready") {
          setStatus({ kind: res.status === "rotated" ? "rotated" : res.status } as Status);
          return;
        }
        setStatus({ kind: "ready", user, twilioToken: res.twilioToken, identity: res.identity });
      } catch (err) {
        setStatus({ kind: "error", message: (err as Error).message });
      }
    });
    return () => unsub();
  }, [wardId, invitationId]);

  const start = useCallback(async () => {
    if (!wardId || !invitationId || !invitationToken) {
      setStatus({ kind: "invalid" });
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus({ kind: "loading" });
    try {
      const res = await callIssueSpeakerSession(
        { wardId, invitationId, invitationToken },
        { useInviteApp: true },
      );
      if (res.status === "rotated") {
        setStatus({ kind: "rotated", phoneLast4: res.phoneLast4 });
        return;
      }
      if (res.status === "rate-limited") {
        setStatus({ kind: "rate-limited" });
        return;
      }
      if (res.status === "invalid") {
        setStatus({ kind: "invalid" });
        return;
      }
      // status === "ready"
      let user = inviteAuth.currentUser;
      if (res.firebaseCustomToken) {
        const cred = await signInWithCustomToken(inviteAuth, res.firebaseCustomToken);
        user = cred.user;
      }
      if (!user) throw new Error("Sign-in returned no user.");
      setStatus({ kind: "ready", user, twilioToken: res.twilioToken, identity: res.identity });
    } catch (err) {
      startedRef.current = false;
      setStatus({ kind: "error", message: (err as Error).message });
    }
  }, [wardId, invitationId, invitationToken]);

  return { status, start };
}
