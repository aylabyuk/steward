import { useParams } from "react-router";
import { LetterCanvas } from "@/features/templates/LetterCanvas";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { useSpeakerInvitation } from "@/features/templates/useSpeakerInvitation";

/**
 * Public landing page: a speaker opens this URL from the mailto link
 * the bishop sent them, and sees their invitation letter rendered at
 * full letter-sheet proportions. No auth — the unguessable token in
 * the URL IS the auth. Rendered content is the frozen snapshot
 * created at `sendSpeakerInvitation` time.
 */
export function SpeakerInvitationLandingPage() {
  const { wardId, token } = useParams<{ wardId: string; token: string }>();
  const state = useSpeakerInvitation(wardId, token);

  return (
    <main className="min-h-dvh bg-[#e6ddc7] py-10 overflow-x-auto">
      {state.kind === "ready" && (
        <>
          <PrintToolbar />
          <PrintOnlyLetter
            wardName={state.invitation.wardName}
            assignedDate={state.invitation.assignedDate}
            today={state.invitation.sentOn}
            bodyMarkdown={state.invitation.bodyMarkdown}
            footerMarkdown={state.invitation.footerMarkdown}
          />
        </>
      )}
      <Body state={state} />
    </main>
  );
}

function Body({ state }: { state: ReturnType<typeof useSpeakerInvitation> }) {
  if (state.kind === "loading") {
    return (
      <div className="mt-20 mx-auto max-w-md text-center font-serif italic text-[14px] text-walnut-2">
        Loading letter…
      </div>
    );
  }
  if (state.kind === "not-found") return <NotFound />;
  if (state.kind === "error") {
    return (
      <div className="mt-20 mx-auto max-w-md rounded-lg border border-border bg-chalk p-6 text-center">
        <p className="font-display text-[20px] text-walnut mb-2">We couldn't load the letter</p>
        <p className="font-serif italic text-[13.5px] text-walnut-2">{state.message}</p>
      </div>
    );
  }
  const { invitation } = state;
  return (
    <div className="w-fit mx-auto">
      <LetterCanvas
        wardName={invitation.wardName}
        assignedDate={invitation.assignedDate}
        today={invitation.sentOn}
        bodyMarkdown={invitation.bodyMarkdown}
        footerMarkdown={invitation.footerMarkdown}
      />
    </div>
  );
}

function PrintToolbar() {
  return (
    <div className="print:hidden fixed top-4 right-4 z-10 flex gap-2">
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

function NotFound() {
  return (
    <div className="mt-20 mx-auto max-w-md rounded-lg border border-border bg-chalk p-6 text-center">
      <p className="font-display text-[20px] text-walnut mb-2">Invitation not found</p>
      <p className="font-serif italic text-[13.5px] text-walnut-2">
        The link may have been mistyped, retracted, or expired. Ask whoever sent it for a fresh
        link.
      </p>
    </div>
  );
}
