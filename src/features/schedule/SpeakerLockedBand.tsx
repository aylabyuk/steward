import type { Draft } from "./speakerDraft";

interface Props {
  draft: Draft;
  date: string;
  /** When provided, non-planned speakers render an "Already X —
   *  open conversation" action that calls this. Parent typically
   *  sets a URL search param so the schedule's SpeakerRow auto-opens
   *  its chat dialog above the Assign modal. Omit it (or leave the
   *  draft unsaved) to render the same button visually disabled. */
  onOpenChat?: () => void;
}

/** Action band that sits above the speaker-detail fields in the
 *  Assign Speakers modal. Planned speakers see a "Prepare invitation"
 *  button that opens the per-speaker compose page in a new tab.
 *  Non-planned speakers see "Already X — open conversation". The
 *  prepare button is gated until the speaker has been saved. */
export function SpeakerLockedBand({ draft, date, onOpenChat }: Props): React.ReactElement {
  const status = draft.status;
  const persisted = draft.id !== null;

  function openPrepare() {
    if (!persisted || !draft.id) return;
    const url = `/week/${encodeURIComponent(date)}/speaker/${encodeURIComponent(draft.id)}/prepare`;
    window.open(url, "_blank", "noopener,noreferrer");
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
      onClick={() => onOpenChat?.()}
      disabled={!onOpenChat}
      aria-label={label}
      className="w-full mb-2.5 border border-walnut bg-walnut text-parchment rounded-md font-mono text-[10px] uppercase tracking-[0.14em] font-medium py-2 hover:bg-walnut-2 shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label} →
    </button>
  );
}
