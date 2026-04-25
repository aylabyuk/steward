import type { SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { SoftLockedNote } from "./SoftLockedNote";
import { SpeakerCardHeader } from "./SpeakerCardHeader";
import { SpeakerEditFields } from "./SpeakerEditFields";
import type { Draft } from "./speakerDraft";
import { SpeakerLockedBand } from "./SpeakerLockedBand";

// Card surface tone follows the speaker's status so the bishop can
// scan the grid by colour. Backgrounds stay light so the soft-lock
// note + parchment input fields remain legible.
const STATUS_BG: Record<SpeakerStatus, string> = {
  planned: "bg-chalk border-border",
  invited: "bg-parchment-2/40 border-brass-soft",
  confirmed: "bg-success-soft/30 border-success-soft",
  declined: "bg-danger-soft/30 border-danger-soft",
};

interface Props {
  draft: Draft;
  index: number;
  /** Meeting date (ISO `YYYY-MM-DD`). Threaded down to the action
   *  band, which builds the per-speaker prepare-invitation URL from
   *  it. */
  date: string;
  onChange: (partial: Partial<Draft>) => void;
  onRemove: () => void;
  /** Called when the bishop hits the non-planned card's "Already X
   *  — open conversation" action. Parent typically sets a URL search
   *  param so the schedule's SpeakerRow auto-opens its chat dialog
   *  above the Assign modal. Omit for unsaved drafts (no chat yet). */
  onOpenChat?: () => void;
  /** When true the card reserves vertical space for the soft-lock
   *  caption even if this particular card is still planned, so all
   *  cards in the parent grid share a uniform field-row alignment.
   *  Set by the parent list when at least one sibling card is
   *  non-planned. */
  reserveLockSlot?: boolean;
}

export function SpeakerEditCard({
  draft,
  index,
  date,
  onChange,
  onRemove,
  onOpenChat,
  reserveLockSlot,
}: Props) {
  const softLocked = draft.status !== "planned";
  const showLockSlot = softLocked || Boolean(reserveLockSlot);
  return (
    <div className={cn("border rounded-lg p-3 flex flex-col", STATUS_BG[draft.status])}>
      <SpeakerCardHeader index={index} status={draft.status} onRemove={onRemove} />

      {showLockSlot && <SoftLockedNote hidden={!softLocked} />}

      <SpeakerLockedBand draft={draft} date={date} {...(onOpenChat ? { onOpenChat } : {})} />

      <SpeakerEditFields draft={draft} softLocked={softLocked} onChange={onChange} />
    </div>
  );
}
