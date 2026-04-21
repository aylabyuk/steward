import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { AcceptInviteBody, type AcceptInviteState } from "@/features/invites/AcceptInviteBody";
import { acceptInvite, findInvitesForEmail } from "@/features/invites/inviteActions";
import { db } from "@/lib/firebase";
import { inviteSchema } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { reportSaveError } from "@/stores/saveStatusStore";

/**
 * Standalone landing page an invitee hits from the mailto link. First
 * tries the direct invite doc at the deep-linked ward (the fast / common
 * path) and only falls back to a cross-ward collectionGroup search when
 * that doesn't find anything — so a subtle collectionGroup rule/index
 * hiccup can't silently hide an otherwise-valid invite.
 */
export function AcceptInvitePage() {
  const { wardId } = useParams<{ wardId: string }>();
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const setWardId = useCurrentWardStore((s) => s.setWardId);
  const navigate = useNavigate();
  const [state, setState] = useState<AcceptInviteState>({ kind: "loading" });

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "signed_out") {
      setState({ kind: "signed-out" });
      return;
    }
    if (!user || !wardId) return;
    const email = (user.email ?? "").toLowerCase();
    if (!email) {
      setState({ kind: "no-invite", email: "(missing email on account)" });
      return;
    }
    (async () => {
      // Primary: direct invite doc at the deep-linked ward. The invitee
      // isn't a ward member yet, so we can't read the ward doc — we rely
      // on wardName being snapshotted into the invite itself.
      const directRef = doc(db, "wards", wardId, "invites", email);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        const invite = inviteSchema.parse(directSnap.data());
        setState({
          kind: "ready",
          invite: {
            wardId,
            wardName: invite.wardName || wardId,
            inviteId: email,
            displayName: invite.displayName,
            calling: invite.calling,
            invitedByName: invite.invitedByName,
          },
        });
        return;
      }
      // Fallback: cross-ward lookup (wrong ward link, or new scenarios).
      const invites = await findInvitesForEmail(email);
      if (invites.length > 0) {
        setState({ kind: "wrong-ward", email, elsewhere: invites });
        return;
      }
      setState({ kind: "no-invite", email });
    })().catch((err) => {
      reportSaveError(err);
      setState({ kind: "no-invite", email });
    });
  }, [authStatus, user, wardId]);

  if (!wardId) return <Navigate to="/" replace />;
  if (state.kind === "signed-out") return <Navigate to="/login" replace />;

  async function accept() {
    if (!user || !wardId || state.kind !== "ready") return;
    const snapshot = state;
    setState({ kind: "accepting" });
    try {
      await acceptInvite(wardId, user.uid, user.email ?? "");
      setWardId(wardId);
      setState({ kind: "done" });
      navigate("/schedule", { replace: true });
    } catch (e) {
      reportSaveError(e);
      setState(snapshot);
    }
  }

  return (
    <main className="min-h-dvh bg-parchment paper-grain grid place-items-center p-6">
      <div className="w-full max-w-md rounded-[14px] border border-border-strong bg-chalk p-7 shadow-elev-3">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
          Ward invitation
        </div>
        <AcceptInviteBody
          state={state}
          onAccept={() => void accept()}
          onSignOut={() => void signOut()}
        />
      </div>
    </main>
  );
}
