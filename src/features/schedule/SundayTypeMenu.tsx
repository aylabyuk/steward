import { useEffect, useRef, useState } from "react";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { updateMeetingField } from "@/features/meetings/utils/updateMeeting";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { MobileBottomSheet } from "@/components/ui/MobileBottomSheet";
import { SundayMenuOptions } from "./SundayMenuOptions";

interface Props {
  wardId: string;
  date: string;
  currentType: MeetingType;
  locked: boolean;
  nonMeetingSundays: readonly NonMeetingSunday[];
  /** When true, surface "Plan speakers" / "Plan prayers" actions at
   *  the top of the menu. Used by the mobile list view, where hover-
   *  revealed plan links don't translate. Desktop cards keep their
   *  inline plan links and leave this off. */
  showPlanActions?: boolean;
}

export function SundayTypeMenu({
  wardId,
  date,
  currentType,
  locked,
  nonMeetingSundays,
  showPlanActions = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open || isMobile) return;
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
  }, [open, isMobile]);

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
      {open && !isMobile && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 min-w-50 bg-chalk border border-border rounded-lg shadow-[0_10px_28px_rgba(58,37,25,0.12),0_2px_6px_rgba(58,37,25,0.06)] p-1.5 z-20 animate-[menuIn_120ms_ease-out]"
        >
          <SundayMenuOptions
            date={date}
            currentType={currentType}
            locked={locked}
            showPlanActions={showPlanActions}
            onSelect={handleSelect}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
      {isMobile && (
        <MobileBottomSheet open={open} onClose={() => setOpen(false)}>
          <SundayMenuOptions
            date={date}
            currentType={currentType}
            locked={locked}
            showPlanActions={showPlanActions}
            onSelect={handleSelect}
            onClose={() => setOpen(false)}
          />
        </MobileBottomSheet>
      )}
    </div>
  );
}
