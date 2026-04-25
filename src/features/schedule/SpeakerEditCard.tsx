import { cn } from "@/lib/cn";
import { SoftLockedNote } from "./SoftLockedNote";
import { SpeakerCardHeader } from "./SpeakerCardHeader";
import { SpeakerEditFields } from "./SpeakerEditFields";
import type { Draft } from "./speakerDraft";
import { SpeakerLockedBand } from "./SpeakerLockedBand";

interface Props {
  draft: Draft;
  index: number;
  onChange: (partial: Partial<Draft>) => void;
  onRemove: () => void;
  /** Step-2 read-only mode: disables all inputs, hides the remove
   *  button, and shows the Prepare-invitation / open-conversation
   *  action band. Same card shell renders in both modes so the
   *  modal's dimensions stay stable across steps. `invitationId` +
   *  `onOpenChat` drive the non-planned "open conversation" button;
   *  the parent is responsible for closing the Assign modal before
   *  the chat dialog opens. */
  locked?: {
    date: string;
    invitationId?: string | null;
    onOpenChat?: (invitationId: string) => void;
  };
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
  onChange,
  onRemove,
  locked,
  reserveLockSlot,
}: Props) {
  const readOnly = Boolean(locked);
  const softLocked = !readOnly && draft.status !== "planned";
  const showLockSlot = !readOnly && (softLocked || Boolean(reserveLockSlot));
  return (
    <div
      className={cn(
        "border rounded-lg p-3 flex flex-col",
        softLocked ? "bg-parchment-2/40 border-brass-soft" : "bg-chalk border-border",
      )}
    >
      <SpeakerCardHeader
        index={index}
        status={draft.status}
        onRemove={readOnly ? null : onRemove}
      />

      {showLockSlot && <SoftLockedNote hidden={!softLocked} />}

      <SpeakerLockedBand
        draft={draft}
        date={locked?.date ?? ""}
        step={locked ? "invite" : "edit"}
        invitationId={locked?.invitationId ?? null}
        {...(locked?.onOpenChat ? { onOpenChat: locked.onOpenChat } : {})}
      />

      <SpeakerEditFields
        draft={draft}
        readOnly={readOnly}
        softLocked={softLocked}
        onChange={onChange}
      />
    </div>
  );
}
