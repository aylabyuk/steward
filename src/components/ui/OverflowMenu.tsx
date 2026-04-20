import { useState } from "react";

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
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
          <circle cx="4" cy="10" r="1.6" />
          <circle cx="10" cy="10" r="1.6" />
          <circle cx="16" cy="10" r="1.6" />
        </svg>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default bg-transparent"
          />
          <ul
            role="menu"
            className="absolute right-0 z-20 mt-1 min-w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
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
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                    item.destructive ? "text-red-700" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
