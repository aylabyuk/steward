import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SubState } from "@/hooks/_sub";
import { SPEAKER_STATUSES, type Member, type SpeakerStatus, type WithId } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { StatusSource } from "@/lib/types/meeting";
import { computeConfirmCopy } from "../utils/speakerStatusConfirmCopy";

const STATE_LABELS: Record<SpeakerStatus, string> = {
  planned: "Planned",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
};

const BADGE_TONE: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 text-walnut border-border",
  invited: "bg-brass-soft text-brass-deep border-brass-soft",
  confirmed: "bg-success-soft text-success border-success-soft",
  declined: "bg-danger-soft text-bordeaux border-danger-soft",
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

/** Tappable status badge that opens a 4-item dropdown menu of
 *  available transitions. Replaces the prior 4-segment radio strip:
 *  the strip read as a tab bar / view filter (a convention collision
 *  against state mutation), and on phone widths it ate ~36pt of
 *  vertical space above every chat. The badge is now the indicator
 *  and the edit affordance in the same place — its tinted fill +
 *  border read as tappable on their own, no chevron needed.
 *  Each menu item shows a checkmark next to the active status; the
 *  Decline option carries destructive (bordeaux) styling. Friction
 *  transitions still route through `computeConfirmCopy` +
 *  `ConfirmDialog`; Invited → Planned stays frictionless. */
export function SpeakerStatusMenu({
  status,
  onChange,
  currentStatusSource,
  currentStatusSetBy,
  members,
  currentUserUid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<SpeakerStatus | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function requestChange(next: SpeakerStatus) {
    setOpen(false);
    if (next === status) return;
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
      <div className="relative inline-flex" ref={ref}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Status: ${STATE_LABELS[status]}. Tap to change.`}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border whitespace-nowrap transition-colors hover:brightness-95",
            BADGE_TONE[status],
          )}
        >
          {STATE_LABELS[status]}
        </button>
        {open && (
          <ul
            role="menu"
            className="absolute left-0 top-full mt-1.5 min-w-44 bg-chalk border border-border rounded-lg shadow-[0_10px_28px_rgba(58,37,25,0.12),0_2px_6px_rgba(58,37,25,0.06)] p-1.5 z-30 list-none m-0 animate-[menuIn_120ms_ease-out]"
          >
            {SPEAKER_STATUSES.map((s) => {
              const active = s === status;
              const destructive = s === "declined";
              return (
                <li key={s} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => requestChange(s)}
                    className={cn(
                      "w-full flex items-center gap-2 font-sans text-[13px] px-3 py-1.5 rounded-sm transition-colors",
                      destructive
                        ? "text-bordeaux hover:bg-danger-soft"
                        : "text-walnut hover:bg-parchment",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-block w-3.5 text-walnut-3 leading-none",
                        active && "text-walnut",
                      )}
                    >
                      {active ? "✓" : ""}
                    </span>
                    {destructive ? "Mark as Declined" : STATE_LABELS[s]}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
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
