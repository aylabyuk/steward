import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  mine: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/** Small overflow menu that appears on hover (desktop) or always
 *  (mobile, via -group- parent), letting participants edit or delete
 *  their own recent messages. Permissions resolved by the parent. */
export function BubbleActions({
  mine,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: Props): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!canEdit && !canDelete) return null;

  return (
    <div
      ref={rootRef}
      className="relative opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center w-7 h-7 rounded-full text-walnut-3 hover:text-walnut hover:bg-parchment-2"
      >
        <KebabIcon />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-10 bottom-full mb-1 min-w-[7.5rem] rounded-md border border-border-strong bg-chalk shadow-elev-2 py-1",
            mine ? "right-0" : "left-0",
          )}
        >
          {canEdit && (
            <MenuItem
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              label="Edit"
            />
          )}
          {canDelete && (
            <MenuItem
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              label="Delete"
              danger
            />
          )}
        </div>
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

function KebabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </svg>
  );
}
