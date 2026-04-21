import { useParams } from "react-router";
import { LetterCanvas } from "@/features/templates/LetterCanvas";
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
    <main className="min-h-dvh bg-[#e6ddc7] py-10 px-4 sm:px-6 flex items-start justify-center">
      <Body state={state} />
    </main>
  );
}

function Body({ state }: { state: ReturnType<typeof useSpeakerInvitation> }) {
  if (state.kind === "loading") {
    return <div className="mt-20 font-serif italic text-[14px] text-walnut-2">Loading letter…</div>;
  }
  if (state.kind === "not-found") {
    return <NotFound />;
  }
  if (state.kind === "error") {
    return (
      <div className="mt-20 max-w-md rounded-lg border border-border bg-chalk p-6 text-center">
        <p className="font-display text-[20px] text-walnut mb-2">We couldn't load the letter</p>
        <p className="font-serif italic text-[13.5px] text-walnut-2">{state.message}</p>
      </div>
    );
  }
  const { invitation } = state;
  return (
    <LetterCanvas
      wardName={invitation.wardName}
      assignedDate={invitation.assignedDate}
      today={invitation.sentOn}
      bodyMarkdown={invitation.bodyMarkdown}
      footerMarkdown={invitation.footerMarkdown}
    />
  );
}

function NotFound() {
  return (
    <div className="mt-20 max-w-md rounded-lg border border-border bg-chalk p-6 text-center">
      <p className="font-display text-[20px] text-walnut mb-2">Invitation not found</p>
      <p className="font-serif italic text-[13.5px] text-walnut-2">
        The link may have been mistyped, retracted, or expired. Ask whoever sent it for a fresh
        link.
      </p>
    </div>
  );
}
