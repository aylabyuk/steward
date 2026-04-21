import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface OverflowMenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

interface Props {
  items: readonly OverflowMenuItem[];
  ariaLabel?: string;
}

export function OverflowMenu({ items, ariaLabel = "More actions" }: Props) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

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

  // Decide whether the menu should open downward or flip above the trigger.
  // Measured synchronously before paint so there is no visual jump.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const GAP = 16;
    const spaceBelow = window.innerHeight - trigger.bottom;
    const spaceAbove = trigger.top;
    setDirection(spaceBelow < menuHeight + GAP && spaceAbove > spaceBelow ? "up" : "down");
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-walnut-3 hover:text-walnut border border-transparent hover:border-border hover:bg-parchment-2 transition-colors leading-none"
      >
        <span className="text-lg -mt-0.5">⋯</span>
      </button>
      {open && (
        <ul
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute right-0 min-w-44 bg-chalk border border-border rounded-lg shadow-[0_10px_28px_rgba(58,37,25,0.12),0_2px_6px_rgba(58,37,25,0.06)] p-1.5 z-20 list-none m-0",
            direction === "down"
              ? "top-full mt-1.5 animate-[menuIn_120ms_ease-out]"
              : "bottom-full mb-1.5 animate-[menuInUp_120ms_ease-out]",
          )}
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "w-full text-left font-sans text-[13px] px-3 py-1.5 rounded-sm transition-colors",
                  item.destructive
                    ? "text-bordeaux hover:bg-danger-soft"
                    : "text-walnut hover:bg-parchment",
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
