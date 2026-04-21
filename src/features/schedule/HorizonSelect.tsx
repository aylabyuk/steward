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
    <div className="relative w-full sm:w-auto font-mono">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full sm:w-auto inline-flex items-center gap-2.5 px-3.5 py-2 text-walnut bg-chalk border rounded-lg hover:bg-parchment-2 hover:border-walnut-3 transition-all duration-120",
          open ? "border-walnut" : "border-border-strong",
        )}
      >
        <span className="text-[9.5px] uppercase tracking-[0.18em] text-walnut-3 font-medium">
          Showing
        </span>
        <span className="font-display text-sm font-medium tracking-[-0.005em]">{display}</span>
        <span
          className={cn(
            "text-xs text-walnut-3 transition-transform duration-120 ml-auto sm:ml-0.5",
            open && "rotate-180",
          )}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1.5 min-w-50 bg-chalk border border-border rounded-lg shadow-[0_10px_28px_rgba(58,37,25,0.12),0_2px_6px_rgba(58,37,25,0.06)] p-1.5 z-10 animate-[menuIn_120ms_ease-out]"
        >
          {HORIZON_OPTIONS.map((option) => (
            <button
              key={option.weeks}
              onClick={() => handleSelect(option.weeks)}
              className={cn(
                "w-full grid gap-1.5 items-center px-2.5 py-2 text-left text-xs font-display rounded-sm cursor-pointer transition-colors duration-100",
                "grid-cols-[16px_1fr]",
                value === option.weeks
                  ? "text-bordeaux font-medium"
                  : "text-walnut hover:bg-parchment",
              )}
              style={{ gridTemplateColumns: "16px 1fr" }}
            >
              <span className="text-[8px] text-center text-bordeaux leading-none">
                {value === option.weeks ? "•" : ""}
              </span>
              <span>{option.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
