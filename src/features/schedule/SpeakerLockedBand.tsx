import type { Draft } from "./speakerDraft";

interface Props {
  draft: Draft;
  date: string;
}

/** Replaces the SpeakerStatusPills row on a locked (step-2) card.
 *  Planned speakers get a primary "Prepare invitation" action that
 *  opens the full Prepare page in a new tab; invited/confirmed
 *  speakers get a muted note steering the user back to step 1 if
 *  they need to change anything. Height is matched to the pills bar
 *  (py-2 mono eyebrow) so locked and editable cards line up. */
export function SpeakerLockedBand({ draft, date }: Props) {
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
      : "Already invited — open edit mode to change.";

  return (
    <div className="w-full mb-2.5 border border-border-strong bg-parchment-2 text-walnut-2 rounded-md font-serif italic text-[11.5px] py-2 px-2.5 text-center">
      {label}
    </div>
  );
}
