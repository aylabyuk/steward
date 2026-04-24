import type { Draft } from "./speakerDraft";

interface Props {
  draft: Draft;
  date: string;
  /** "invite" (default) — Step 2 behaviour: planned speakers get the
   *  "Prepare invitation →" button; non-planned get the "Already X"
   *  message. "edit" — Step 1 behaviour: planned speakers get a
   *  same-dimensions invisible spacer (no redundant affordance while
   *  the bishop is already editing), non-planned speakers still get
   *  the "Already X" message. Matching dimensions between the two
   *  modes keeps the card total-height stable across step
   *  transitions. */
  step?: "edit" | "invite";
}

/** Band that sits above the speaker-detail fields in both steps of
 *  the Assign Speakers modal. See Props for the step-specific
 *  branching. */
export function SpeakerLockedBand({ draft, date, step = "invite" }: Props): React.ReactElement {
  const status = draft.status;
  const persisted = draft.id !== null;

  function openPrepare() {
    if (!persisted || !draft.id) return;
    const url = `/week/${encodeURIComponent(date)}/speaker/${encodeURIComponent(draft.id)}/prepare`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (status === "planned") {
    if (step === "edit") {
      // Visually hidden placeholder — reserves the same vertical
      // footprint as the Step 2 button so the card height stays
      // stable when the bishop flips between steps.
      return (
        <div
          aria-hidden
          className="w-full mb-2.5 border border-transparent font-mono text-[10px] tracking-[0.14em] font-medium py-2 invisible"
        >
          Prepare invitation →
        </div>
      );
    }
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
