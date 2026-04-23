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
 *  recovery copy for each non-ready branch. Lives inside the invite
 *  page's floating drawer, so the non-ready states fill the drawer
 *  and center their content rather than floating as a card. */
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
  if (status.kind === "loading") {
    return <StateCard>Signing you in…</StateCard>;
  }
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
    <Frame>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
        Continue to the conversation
      </div>
      <p className="font-serif text-[14px] text-walnut-2 mt-2 leading-relaxed max-w-sm">
        Tap below to open the thread with the bishopric. You'll stay signed in on this device for
        the rest of the invitation window.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-5 w-full max-w-xs font-sans text-[14px] font-semibold px-4 py-3 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep"
      >
        Continue
      </button>
    </Frame>
  );
}

/** Fills the drawer and centers its child vertically + horizontally.
 *  The drawer already provides the chalk background + rounded border,
 *  so non-ready states render flush (no card-in-card chrome). */
function Frame({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-0">
      {children}
    </div>
  );
}

function StateCard({ title, children }: { title?: string; children: ReactNode }): ReactElement {
  return (
    <Frame>
      {title && <p className="font-display text-[20px] text-walnut mb-3">{title}</p>}
      <p className="font-serif text-[14px] text-walnut-2 leading-relaxed max-w-sm">{children}</p>
    </Frame>
  );
}
