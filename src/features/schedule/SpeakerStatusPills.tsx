import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SubState } from "@/hooks/_sub";
import { SPEAKER_STATUSES, type Member, type SpeakerStatus, type WithId } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { StatusSource } from "@/lib/types/meeting";
import { computeConfirmCopy } from "./speakerStatusConfirmCopy";

const STATE_LABELS: Record<SpeakerStatus, string> = {
  planned: "Planned",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
};

const STATE_ACTIVE: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 text-walnut",
  invited: "bg-brass-soft text-walnut",
  confirmed: "bg-success-soft text-success",
  declined: "bg-danger-soft text-bordeaux",
};

interface Props {
  status: SpeakerStatus;
  onChange: (status: SpeakerStatus) => void;
  /** Provenance context used to tailor the confirm-dialog body. When
   *  omitted the dialog falls back to the vanilla copy (useful for
   *  callsites where provenance isn't readily available). */
  currentStatusSource?: StatusSource;
  currentStatusSetBy?: string;
  members?: SubState<WithId<Member>[]>;
  currentUserUid?: string | undefined;
}

/** Segmented-control row of speaker statuses. Every transition pops a
 *  confirm dialog with provenance-aware copy — forward moves (→
 *  invited / confirmed / declined) explain the consequence; rollbacks
 *  out of a terminal state (confirmed/declined → planned/invited) add
 *  friction so a misclick doesn't silently erase a real commitment. */
export function SpeakerStatusPills({
  status,
  onChange,
  currentStatusSource,
  currentStatusSetBy,
  members,
  currentUserUid,
}: Props) {
  const [pending, setPending] = useState<SpeakerStatus | null>(null);

  function requestChange(next: SpeakerStatus) {
    if (next === status) return;
    // Invited → Planned stays frictionless (no real commitment to
    // erase). Terminal → any non-terminal goes through the heavier
    // rollback dialog; forward moves go through the base forward
    // dialog. Both paths handled by computeConfirmCopy.
    const isTerminal = status === "confirmed" || status === "declined";
    if (!isTerminal && next === "planned") {
      onChange(next);
      return;
    }
    setPending(next);
  }

  const copy = pending
    ? computeConfirmCopy({
        current: status,
        next: pending,
        currentStatusSource,
        currentStatusSetBy,
        members,
        currentUserUid,
      })
    : null;

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Speaker state"
        className="grid grid-cols-4 border border-border-strong rounded-md overflow-hidden bg-chalk mb-2.5"
      >
        {SPEAKER_STATUSES.map((s, i) => (
          <button
            key={s}
            role="radio"
            aria-checked={status === s}
            onClick={() => requestChange(s)}
            className={cn(
              "font-mono text-[9.5px] uppercase tracking-[0.06em] py-2 text-walnut-2 hover:bg-parchment-2 transition-colors",
              i < SPEAKER_STATUSES.length - 1 && "border-r border-border",
              status === s && STATE_ACTIVE[s],
            )}
          >
            {STATE_LABELS[s]}
          </button>
        ))}
      </div>
      {pending && copy && (
        <ConfirmDialog
          open
          title={copy.title}
          body={copy.body}
          confirmLabel={copy.confirmLabel}
          danger={copy.danger}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            onChange(pending);
            setPending(null);
          }}
        />
      )}
    </>
  );
}
