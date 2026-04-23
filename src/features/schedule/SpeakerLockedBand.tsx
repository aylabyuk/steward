import type { Draft } from "./speakerDraft";

interface Props {
  draft: Draft;
  date: string;
}

/** Replaces the SpeakerStatusPills row on a locked (step-2) card.
 *  Planned speakers get a primary "Prepare invitation →" action
 *  that opens the full Prepare page in a new tab. Everything else
 *  shows a muted "Already X — open edit mode to change" note;
 *  reviewing / applying responses lives on the Sunday card's
 *  per-speaker chat icon now, not here. */
export function SpeakerLockedBand({ draft, date }: Props): React.ReactElement {
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
      ? "Already confirmed — open edit mode to change."
      : status === "declined"
        ? "Already declined — open edit mode to change."
        : "Already invited — open edit mode to change.";

  return (
    <div className="w-full mb-2.5 border border-border-strong bg-parchment-2 text-walnut-2 rounded-md font-serif italic text-[11.5px] py-2 px-2.5 text-center">
      {label}
    </div>
  );
}
