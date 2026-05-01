import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SubState } from "@/hooks/_sub";
import type { Member, SpeakerStatus, WithId } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { StatusSource } from "@/lib/types/meeting";
import { computeConfirmCopy } from "../utils/speakerStatusConfirmCopy";
import { SpeakerStatusMenuList } from "./SpeakerStatusMenuList";

type MenuPosition = { top: number; left: number } | { top: number; right: number };

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
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const inBadge = ref.current?.contains(e.target as Node);
      const inMenu = menuRef.current?.contains(e.target as Node);
      if (!inBadge && !inMenu) setOpen(false);
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

  // Portal-positioned menu — anchored to the badge's bounding rect so
  // the dropdown escapes ancestors with `overflow: hidden` (the
  // mobile schedule card clips otherwise). When the badge sits near
  // the right edge of the viewport (typical on mobile, where the
  // status pill is on the right side of a row), the menu would
  // overflow right — flip to right-edge anchoring in that case.
  // Recompute on scroll + resize so the menu tracks the badge.
  useEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const button = ref.current?.querySelector("button");
    if (!button) return;
    function update() {
      const rect = button!.getBoundingClientRect();
      const top = rect.bottom + 6;
      // Min menu width = `min-w-44` = 11rem = 176px. 8px viewport gutter.
      const wouldOverflow = rect.left + 176 > window.innerWidth - 8;
      setMenuPos(
        wouldOverflow
          ? { top, right: Math.max(8, window.innerWidth - rect.right) }
          : { top, left: rect.left },
      );
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
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
      </div>
      {open &&
        menuPos &&
        createPortal(
          <SpeakerStatusMenuList
            ref={menuRef}
            status={status}
            position={menuPos}
            onPick={requestChange}
          />,
          document.body,
        )}
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
