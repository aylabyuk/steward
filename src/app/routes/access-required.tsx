import { useEffect, useState } from "react";
import { Link } from "react-router";
import { findInvitesForEmail, type PendingInvite } from "@/features/invites/inviteActions";
import { CALLING_LABELS } from "@/features/settings/callingLabels";
import { useAuthStore } from "@/stores/authStore";

export function AccessRequired() {
  const { user, signOut } = useAuthStore();
  const email = user?.email ?? "";
  const [pending, setPending] = useState<PendingInvite[] | null>(null);

  useEffect(() => {
    if (!email) return;
    findInvitesForEmail(email)
      .then((invites) => setPending(invites))
      .catch(() => setPending([]));
  }, [email]);

  return (
    <main className="grid min-h-dvh place-items-center bg-parchment-2 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-chalk p-6 shadow-sm">
        {pending && pending.length > 0 ? (
          <InvitedView email={email} invites={pending} />
        ) : (
          <NoAccessView email={email} loading={pending === null} onSignOut={() => void signOut()} />
        )}
      </div>
    </main>
  );
}

function InvitedView({ email, invites }: { email: string; invites: PendingInvite[] }) {
  return (
    <>
      <h1 className="text-xl font-semibold text-walnut">You've been invited</h1>
      <p className="mt-2 text-sm text-walnut-2">
        Signed in as <b>{email}</b>. Accept the invite below to join the ward.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {invites.map((inv) => (
          <li
            key={inv.wardId}
            className="rounded-md border border-border bg-parchment-2 p-3 text-left"
          >
            <div className="text-sm font-semibold text-walnut">{inv.wardName}</div>
            <div className="text-xs text-walnut-2">
              {CALLING_LABELS[inv.calling]} · invited by {inv.invitedByName}
            </div>
            <Link
              to={`/accept-invite/${inv.wardId}`}
              className="mt-2 inline-flex rounded-md border border-bordeaux bg-bordeaux px-3 py-1 text-xs font-semibold text-chalk hover:bg-bordeaux-deep"
            >
              Accept invite
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function NoAccessView({
  email,
  loading,
  onSignOut,
}: {
  email: string;
  loading: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold text-walnut">Access required</h1>
      <p className="mt-2 text-sm text-walnut-2">
        {loading
          ? "Checking for pending invites…"
          : `We couldn't find an active ward membership or invite for ${email || "your account"}.`}
      </p>
      {!loading && (
        <p className="mt-2 text-xs text-walnut-3">
          Ask your bishopric to send you an invite from the Members page.
        </p>
      )}
      <button
        type="button"
        onClick={onSignOut}
        className="mt-6 rounded-md border border-border bg-chalk px-4 py-2 text-sm font-medium text-walnut hover:bg-parchment-2"
      >
        Sign out
      </button>
    </div>
  );
}
