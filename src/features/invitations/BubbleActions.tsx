import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  mine: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Floating menu of edit / delete actions for a single bubble.
 *  Parent decides when to open it (via long-press); this component
 *  just handles dismissal — outside-click + Escape — and the
 *  per-item rendering. */
export function BubbleActions({
  open,
  mine,
  canEdit,
  canDelete,
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

  if (!open || (!canEdit && !canDelete)) return null;

  return (
    <div
      ref={rootRef}
      role="menu"
      className={cn(
        "absolute z-10 bottom-full mb-1 min-w-30 rounded-md border border-border-strong bg-chalk shadow-elev-2 py-1",
        mine ? "right-0" : "left-0",
      )}
    >
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
