import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import { formatShortDate, formatCountdown } from "./dateFormat";

interface Props {
  date: string;
  urgent?: boolean;
}

export function SundayCardHeader({ date, urgent }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex items-start justify-between gap-3 p-4 pb-2">
      <Link to={`/week/${date}`} className="flex-1 hover:opacity-80 transition-opacity">
        <div className="text-2xl font-display font-semibold text-walnut leading-tight">
          {formatShortDate(date)}
        </div>
        <div className={cn(
          "text-[11px] font-mono tracking-[0.08em] uppercase mt-1",
          urgent ? "text-bordeaux font-semibold" : "text-walnut-3",
        )}>
          {formatCountdown(date)}
        </div>
      </Link>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-walnut-3 hover:text-walnut p-1 text-lg leading-none"
          aria-label="Sunday options"
          aria-expanded={menuOpen}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-chalk border border-border rounded-md shadow-elev-2 z-10 overflow-hidden text-sm">
            <button className="w-full px-4 py-2 text-left text-walnut hover:bg-parchment transition">
              Change type
            </button>
            <button className="w-full px-4 py-2 text-left text-bordeaux hover:bg-danger-soft transition">
              Cancel meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
