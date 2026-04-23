import type { SpeakerInvitation } from "@/lib/types";
import type { SpeakerInvitationState } from "@/features/templates/useSpeakerInvitation";

export { SessionGate } from "./invite-speaker-session-gate";

/** Non-"ready" sub-states for the invite landing page. Split out so
 *  the main route stays under the 150-LOC ceiling while keeping
 *  these warm, bishop-friendly fallback screens close at hand. */
export function NonReadyState({ state }: { state: SpeakerInvitationState }): React.ReactElement {
  if (state.kind === "loading") {
    return (
      <StateFrame>
        <p className="font-serif italic text-[14px] text-walnut-2">Loading letter…</p>
      </StateFrame>
    );
  }
  if (state.kind === "not-found") {
    return (
      <StateFrame>
        <div className="max-w-md w-full rounded-lg border border-border bg-chalk p-6 text-center">
          <p className="font-display text-[20px] text-walnut mb-2">Invitation not found</p>
          <p className="font-serif italic text-[13.5px] text-walnut-2">
            The link may have been mistyped, retracted, or expired. Ask whoever sent it for a fresh
            link.
          </p>
        </div>
      </StateFrame>
    );
  }
  if (state.kind === "error") {
    return (
      <StateFrame>
        <div className="max-w-md w-full rounded-lg border border-border bg-chalk p-6 text-center">
          <p className="font-display text-[20px] text-walnut mb-2">We couldn't load the letter</p>
          <p className="font-serif italic text-[13.5px] text-walnut-2">{state.message}</p>
        </div>
      </StateFrame>
    );
  }
  return <StateFrame />;
}

export function ExpiredState({
  invitation,
}: {
  invitation: SpeakerInvitation;
}): React.ReactElement {
  return (
    <StateFrame>
      <div className="max-w-md w-full rounded-lg border border-border bg-chalk p-6 text-center">
        <p className="font-display text-[20px] text-walnut mb-2">This invitation has ended</p>
        <p className="font-serif text-[13.5px] text-walnut-2 leading-relaxed">
          The assignment was for {invitation.assignedDate}. If you need to reach{" "}
          {invitation.inviterName} at {invitation.wardName}, please contact them directly.
        </p>
      </div>
    </StateFrame>
  );
}

function StateFrame({ children }: { children?: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#e6ddc7] flex items-center justify-center p-4">{children}</main>
  );
}

export function PrintToolbar(): React.ReactElement {
  return (
    <div className="print:hidden flex justify-end">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-md border border-walnut bg-walnut px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk hover:bg-walnut-2 shadow-elev-2"
      >
        <PrinterIcon />
        Print · Save as PDF
      </button>
    </div>
  );
}

function PrinterIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9V2h12v7" />
      <rect x="3" y="9" width="18" height="9" rx="2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}
