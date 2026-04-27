import Markdown from "react-markdown";
import type { PendingInvite } from "@/features/invites/inviteActions";
import { CALLING_LABELS } from "@/lib/callingLabels";

export type AcceptInviteState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "ready"; invite: PendingInvite; messageBody?: string }
  | { kind: "accepting" }
  | { kind: "done" }
  | { kind: "no-invite"; email: string }
  | { kind: "wrong-ward"; email: string; elsewhere: PendingInvite[] };

interface Props {
  state: AcceptInviteState;
  onAccept: () => void;
  onSignOut: () => void;
}

export function AcceptInviteBody({ state, onAccept, onSignOut }: Props) {
  if (state.kind === "loading" || state.kind === "accepting") {
    return <p className="font-serif italic text-[14px] text-walnut-2">Checking invite…</p>;
  }
  if (state.kind === "done") {
    return (
      <p className="font-serif italic text-[14px] text-walnut-2">Welcome aboard — redirecting…</p>
    );
  }
  if (state.kind === "no-invite") {
    return <NoInvite email={state.email} onSignOut={onSignOut} />;
  }
  if (state.kind === "wrong-ward") {
    return <WrongWard elsewhere={state.elsewhere} />;
  }
  return <ReadyBody invite={state.invite} messageBody={state.messageBody} onAccept={onAccept} />;
}

function NoInvite({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <>
      <h1 className="font-display text-[22px] font-semibold text-walnut mb-2">
        No invite for this account
      </h1>
      <p className="font-serif text-[14px] text-walnut-2 mb-3">
        You're signed in as <strong>{email}</strong>. We couldn't find a pending invite for that
        email — the bishop may have sent the invite to a different address, or it was already
        accepted.
      </p>
      <button
        type="button"
        onClick={onSignOut}
        className="w-full rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2"
      >
        Sign out and try again
      </button>
    </>
  );
}

function WrongWard({ elsewhere }: { elsewhere: readonly PendingInvite[] }) {
  return (
    <>
      <h1 className="font-display text-[22px] font-semibold text-walnut mb-2">Wrong ward link</h1>
      <p className="font-serif text-[14px] text-walnut-2 mb-3">
        Your pending invite is for a different ward. Open the link below to accept:
      </p>
      <ul className="flex flex-col gap-2">
        {elsewhere.map((inv) => (
          <li key={inv.wardId} className="rounded-md border border-border bg-parchment-2 px-3 py-2">
            <a
              href={`/accept-invite/${inv.wardId}`}
              className="font-sans text-[13px] font-semibold text-bordeaux-deep hover:text-bordeaux"
            >
              Accept invite to {inv.wardName}
            </a>
            <div className="font-serif text-[12px] text-walnut-3">
              as {CALLING_LABELS[inv.calling]}, invited by {inv.invitedByName}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ReadyBody({
  invite,
  messageBody,
  onAccept,
}: {
  invite: PendingInvite;
  messageBody?: string | undefined;
  onAccept: () => void;
}) {
  return (
    <>
      {messageBody && messageBody.trim().length > 0 && (
        <div className="prose prose-sm max-w-none font-serif text-[14px] text-walnut-2 leading-relaxed mb-5">
          <Markdown>{messageBody}</Markdown>
        </div>
      )}
      <h1 className="font-display text-[22px] font-semibold text-walnut mb-2">
        Join {invite.wardName}?
      </h1>
      <p className="font-serif text-[14px] text-walnut-2 mb-4">
        <strong>{invite.invitedByName}</strong> invited you as{" "}
        <strong>{CALLING_LABELS[invite.calling]}</strong>. Accepting will add you to the ward roster
        so you can help plan meetings.
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="w-full rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep"
      >
        Accept invite
      </button>
    </>
  );
}
