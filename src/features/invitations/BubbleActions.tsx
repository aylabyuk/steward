import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { REACTION_PALETTE, reactionIncludes, type Reactions } from "./utils/reactions";

interface ReactionPaletteConfig {
  identity: string;
  reactions: Reactions;
  onToggle: (emoji: string) => void;
}

interface Props {
  open: boolean;
  mine: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** When provided, the menu shows a horizontal palette row of
   *  reaction emojis above the edit/delete items. Tap an emoji to
   *  toggle the viewer's reaction with that emoji. The viewer's
   *  current reactions render with a tinted ring so they read as
   *  toggleable rather than additive. */
  reactionPalette?: ReactionPaletteConfig;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Floating menu of edit / delete / react actions for a single
 *  bubble. Parent decides when to open it (via long-press); this
 *  component just handles dismissal — outside-click + Escape — and
 *  the per-item rendering. */
export function BubbleActions({
  open,
  mine,
  canEdit,
  canDelete,
  reactionPalette,
  onEdit,
  onDelete,
  onClose,
}: Props): React.ReactElement | null {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || (!canEdit && !canDelete && !reactionPalette)) return null;

  const showActions = canEdit || canDelete;

  return (
    // Single-row capsule: emoji palette on the leading edge, a thin
    // divider, then icon-only Edit/Delete on the trailing edge.
    // One container keeps the rounding consistent (vs. earlier
    // two-card stack with mismatched radii).
    <div
      ref={rootRef}
      role="menu"
      className={cn(
        "absolute z-10 bottom-full mb-1 flex items-center gap-1 px-2 py-1.5",
        "rounded-full border border-border-strong bg-chalk shadow-elev-2",
        mine ? "right-0" : "left-0",
      )}
    >
      {reactionPalette &&
        REACTION_PALETTE.map((emoji) => {
          const mineReaction = reactionIncludes(
            reactionPalette.reactions,
            emoji,
            reactionPalette.identity,
          );
          return (
            <button
              key={emoji}
              role="menuitem"
              type="button"
              aria-pressed={mineReaction}
              aria-label={`React with ${emoji}${mineReaction ? " (selected)" : ""}`}
              onClick={() => {
                onClose();
                reactionPalette.onToggle(emoji);
              }}
              className={cn(
                "rounded-full text-[18px] leading-none w-8 h-8 flex items-center justify-center transition-colors",
                mineReaction
                  ? "bg-danger-soft ring-1 ring-bordeaux/40"
                  : "hover:bg-parchment-2",
              )}
            >
              {emoji}
            </button>
          );
        })}
      {reactionPalette && showActions && (
        <span aria-hidden="true" className="mx-1 h-7 w-px bg-border" />
      )}
      {canEdit && (
        <IconButton
          label="Edit"
          onClick={() => {
            onClose();
            onEdit();
          }}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[18px] h-[18px]"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          }
        />
      )}
      {canDelete && (
        <IconButton
          label="Delete"
          danger
          onClick={() => {
            onClose();
            onDelete();
          }}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[18px] h-[18px]"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
          }
        />
      )}
    </div>
  );
}

function IconButton({
  label,
  danger,
  onClick,
  icon,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-full w-8 h-8 flex items-center justify-center transition-colors",
        danger ? "text-bordeaux hover:bg-danger-soft/60" : "text-walnut hover:bg-parchment-2",
      )}
    >
      {icon}
    </button>
  );
}
