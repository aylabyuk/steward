import type { ReactElement, ReactNode } from "react";

interface SessionStatus {
  kind: "idle" | "loading" | "ready" | "rotated" | "rate-limited" | "invalid" | "error";
  phoneLast4?: string | null;
  message?: string;
}

/** Wraps the chat pane with the capability-token exchange dance.
 *  Renders a "Tap to continue" prompt on idle (so SMS-app link
 *  prefetchers can't consume the token on a bare GET), delegates to
 *  the chat only once the session reaches `"ready"`, and renders
 *  recovery copy for each non-ready branch. */
export function SessionGate({
  status,
  onStart,
  children,
}: {
  status: SessionStatus;
  onStart: () => void;
  children: ReactNode;
}): ReactElement {
  if (status.kind === "ready") return <>{children}</>;
  if (status.kind === "loading") return <StateCard>Signing you in…</StateCard>;
  if (status.kind === "rotated") {
    const tail = status.phoneLast4 ? `ending in ••${status.phoneLast4}` : "on file";
    return (
      <StateCard title="That link's been used already">
        We've sent a fresh link to the phone {tail}. Tap it when it arrives — it should be there in
        a few seconds.
      </StateCard>
    );
  }
  if (status.kind === "rate-limited") {
    return (
      <StateCard title="Too many fresh links today">
        For security we cap the number of replacement links per day. Please reach out to the
        bishopric directly and they can send a new invitation.
      </StateCard>
    );
  }
  if (status.kind === "invalid") {
    return (
      <StateCard title="This link isn't valid">
        Check the text message the bishopric sent and open the link from there, or ask them to
        resend the invitation.
      </StateCard>
    );
  }
  if (status.kind === "error") {
    return (
      <StateCard title="Something went wrong">{status.message ?? "Please try again."}</StateCard>
    );
  }
  return (
    <div className="bg-chalk border border-border rounded-lg shadow-elev-1 p-5 flex flex-col gap-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
          Continue to the conversation
        </div>
        <p className="font-serif text-[13px] text-walnut-2 mt-1 leading-relaxed">
          Tap below to open the thread with the bishopric. You'll stay signed in on this device for
          the rest of the invitation window.
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="self-start font-sans text-[13px] font-semibold px-4 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep"
      >
        Continue
      </button>
    </div>
  );
}

function StateCard({ title, children }: { title?: string; children: ReactNode }): ReactElement {
  return (
    <div className="bg-chalk border border-border rounded-lg shadow-elev-1 p-5">
      {title && <p className="font-display text-[18px] text-walnut mb-2">{title}</p>}
      <p className="font-serif text-[13px] text-walnut-2 leading-relaxed">{children}</p>
    </div>
  );
}
