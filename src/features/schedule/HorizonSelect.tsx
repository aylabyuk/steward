import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const HORIZON_OPTIONS = [
  { label: "1 month", display: "Next 1 month", weeks: 4 },
  { label: "2 months", display: "Next 2 months", weeks: 9 },
  { label: "3 months", display: "Next 3 months", weeks: 13 },
  { label: "6 months", display: "Next 6 months", weeks: 26 },
  { label: "12 months", display: "Next 12 months", weeks: 52 },
];

interface Props {
  value: number;
  onChange: (weeks: number) => void;
}

export function HorizonSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = HORIZON_OPTIONS.find((o) => o.weeks === value);
  const display = selectedOption?.display ?? "Schedule";

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  function handleSelect(weeks: number) {
    onChange(weeks);
    localStorage.setItem("schedule-horizon-weeks", String(weeks));
    setOpen(false);
  }

  return (
    <div className="relative w-full sm:w-auto">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-full sm:w-auto flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 py-2 text-sm font-medium text-walnut border border-border rounded-lg hover:bg-parchment-2 transition-all duration-150 hover:border-border-strong"
      >
        <span className="text-xs uppercase tracking-[0.18em] text-walnut-3">Showing</span>
        <span className="font-medium">{display}</span>
        <span className={cn("text-xs text-walnut-2 transition-transform duration-150 ml-auto sm:ml-1", open && "rotate-180")}>
          ▼
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            "absolute right-0 mt-2 w-48 bg-chalk border border-border rounded-lg shadow-elev-3 overflow-hidden z-10 sm:w-48",
            "animate-[fadePop_0.15s_ease-out]",
          )}
        >
          {HORIZON_OPTIONS.map((option) => (
            <button
              key={option.weeks}
              onClick={() => handleSelect(option.weeks)}
              className={cn(
                "w-full px-4 py-2.5 text-left text-sm transition-colors duration-100",
                value === option.weeks
                  ? "bg-brass-soft text-walnut font-medium"
                  : "text-walnut hover:bg-parchment-2",
              )}
            >
              {option.display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
