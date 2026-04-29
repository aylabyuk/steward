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

  return (
    <div
      ref={rootRef}
      role="menu"
      className={cn(
        "absolute z-10 bottom-full mb-1 rounded-md border border-border-strong bg-chalk shadow-elev-2",
        mine ? "right-0" : "left-0",
      )}
    >
      {reactionPalette && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border" role="group" aria-label="React with emoji">
          {REACTION_PALETTE.map((emoji) => {
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
        </div>
      )}
      <div className="min-w-30 py-1">
        {canEdit && (
          <MenuItem
            onClick={() => {
              onClose();
              onEdit();
            }}
            label="Edit"
          />
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              onClose();
              onDelete();
            }}
            label="Delete"
            danger
          />
        )}
        {!canEdit && !canDelete && reactionPalette && (
          <div className="px-3 py-1 font-sans text-[11px] text-walnut-3">React only</div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-1.5 font-sans text-[12.5px] transition-colors",
        danger ? "text-bordeaux hover:bg-danger-soft/50" : "text-walnut hover:bg-parchment-2",
      )}
    >
      {label}
    </button>
  );
}
