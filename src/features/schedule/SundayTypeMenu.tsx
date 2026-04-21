import { useEffect, useRef, useState } from "react";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { updateMeetingField } from "@/features/meetings/updateMeeting";
import { TYPE_LABELS } from "@/features/meetings/meetingLabels";
import { cn } from "@/lib/cn";

interface Props {
  wardId: string;
  date: string;
  currentType: MeetingType;
  locked: boolean;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

const TYPES: readonly MeetingType[] = ["regular", "fast", "stake", "general"];

export function SundayTypeMenu({ wardId, date, currentType, locked, nonMeetingSundays }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
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

  async function handleSelect(type: MeetingType) {
    if (locked || saving || type === currentType) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      await updateMeetingField(wardId, date, nonMeetingSundays, { meetingType: type });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-walnut-3 hover:text-walnut border border-transparent hover:border-border hover:bg-parchment-2 rounded-md w-7 h-7 inline-flex items-center justify-center leading-none transition-colors"
        aria-label="Sunday options"
        aria-expanded={open}
      >
        <span className="text-lg -mt-0.5">⋯</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 min-w-50 bg-chalk border border-border rounded-lg shadow-[0_10px_28px_rgba(58,37,25,0.12),0_2px_6px_rgba(58,37,25,0.06)] p-1.5 z-20 animate-[menuIn_120ms_ease-out]"
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-walnut-3 px-2.5 pt-1.5 pb-1">
            Sunday type
          </div>
          {TYPES.map((type) => {
            const active = type === currentType;
            const disabled = locked && !active;
            return (
              <button
                key={type}
                role="menuitemradio"
                aria-checked={active}
                aria-disabled={disabled}
                onClick={() => !disabled && handleSelect(type)}
                className={cn(
                  "grid grid-cols-[16px_1fr] items-center gap-1.5 w-full px-2.5 py-1.5 text-left font-display text-[13px] rounded-sm transition-colors",
                  active && "text-bordeaux font-medium",
                  !active && !disabled && "text-walnut hover:bg-parchment",
                  disabled && "text-walnut-3 opacity-40 cursor-not-allowed",
                )}
              >
                <span className="text-[8px] text-bordeaux text-center leading-none">
                  {active ? "•" : ""}
                </span>
                <span>{TYPE_LABELS[type]}</span>
              </button>
            );
          })}
          {locked && (
            <div className="flex items-start gap-1.5 px-2.5 pt-2 pb-1 mt-1 border-t border-border font-mono text-[9.5px] uppercase tracking-[0.08em] text-walnut-3 leading-[1.35]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-bordeaux shrink-0 mt-0.5">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
              <span>Locked — remove confirmed speakers to change.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
