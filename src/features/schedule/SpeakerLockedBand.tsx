import type { Draft } from "./speakerDraft";

interface Props {
  draft: Draft;
  date: string;
  /** "invite" (default) — Step 2 behaviour: planned speakers get the
   *  "Prepare invitation →" button; non-planned speakers get an
   *  "Already X — open conversation" action that closes the Assign
   *  modal + opens the per-speaker chat dialog. "edit" — Step 1
   *  behaviour: everyone gets an invisible placeholder matching the
   *  Step 2 band dimensions so the card height stays stable across
   *  step transitions. */
  step?: "edit" | "invite";
  /** Latest invitation id for this speaker, when one exists. The
   *  button still works without one — SpeakerRow's dialog handles
   *  the no-invitation case with a placeholder. */
  invitationId?: string | null;
  /** Called by the Step 2 "open conversation" button right before it
   *  navigates — the parent closes the Assign modal so the chat
   *  dialog renders on top of the clean schedule view. Receives the
   *  invitationId when one is on file so the URL hint can pick the
   *  exact invitation; null means route via speakerId instead. */
  onOpenChat?: (invitationId: string | null) => void;
}

/** Band that sits above the speaker-detail fields in both steps of
 *  the Assign Speakers modal. See Props for the step-specific
 *  branching. */
export function SpeakerLockedBand({
  draft,
  date,
  step = "invite",
  invitationId,
  onOpenChat,
}: Props): React.ReactElement {
  const status = draft.status;
  const persisted = draft.id !== null;

  function openPrepare() {
    if (!persisted || !draft.id) return;
    const url = `/week/${encodeURIComponent(date)}/speaker/${encodeURIComponent(draft.id)}/prepare`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openChat() {
    if (!onOpenChat) return;
    onOpenChat(invitationId ?? null);
  }

  if (step === "edit") {
    // Visually hidden placeholder for Step 1 regardless of status —
    // the bishop is already editing, so neither the "Prepare
    // invitation" button nor the "open edit mode to change" nudge
    // belong here. Matching the Step 2 band's vertical footprint
    // keeps the card height stable across step transitions.
    return (
      <div
        aria-hidden
        className="w-full mb-2.5 border border-transparent font-mono text-[10px] tracking-[0.14em] font-medium py-2 invisible"
      >
        Prepare invitation →
      </div>
    );
  }

  if (status === "planned") {
    return (
      <button
        type="button"
        onClick={openPrepare}
        disabled={!persisted}
        aria-label={`Open prepare invitation for ${draft.name || "speaker"}`}
        className="w-full mb-2.5 border border-bordeaux-deep bg-bordeaux text-parchment rounded-md font-mono text-[10px] uppercase tracking-[0.14em] font-medium py-2 hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Prepare invitation →
      </button>
    );
  }

  const label =
    status === "confirmed"
      ? "Already confirmed — open conversation"
      : status === "declined"
        ? "Already declined — open conversation"
        : "Already invited — open conversation";

  return (
    <button
      type="button"
      onClick={openChat}
      disabled={!onOpenChat}
      aria-label={label}
      className="w-full mb-2.5 border border-walnut bg-walnut text-parchment rounded-md font-mono text-[10px] uppercase tracking-[0.14em] font-medium py-2 hover:bg-walnut-2 shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label} →
    </button>
  );
}
