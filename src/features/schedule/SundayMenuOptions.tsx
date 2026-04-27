import type { MeetingType } from "@/lib/types";
import { TYPE_LABELS } from "@/features/meetings/utils/meetingLabels";
import { cn } from "@/lib/cn";
import { SundayMenuPlanActions } from "./SundayMenuPlanActions";

const TYPES: readonly MeetingType[] = ["regular", "fast", "stake", "general"];

interface Props {
  date: string;
  currentType: MeetingType;
  locked: boolean;
  showPlanActions: boolean;
  onSelect: (type: MeetingType) => void;
  onClose: () => void;
}

/** Inner content of the SundayTypeMenu: Plan actions (mobile only) +
 *  Sunday-type radio + locked notice. Rendered inside either the
 *  desktop popover or the mobile bottom sheet. */
export function SundayMenuOptions({
  date,
  currentType,
  locked,
  showPlanActions,
  onSelect,
  onClose,
}: Props) {
  return (
    <>
      {showPlanActions && <SundayMenuPlanActions date={date} onSelect={onClose} />}
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
            onClick={() => !disabled && onSelect(type)}
            className={cn(
              "grid grid-cols-[16px_1fr] items-center gap-1.5 w-full px-2.5 py-2 text-left font-display text-[13.5px] rounded-sm transition-colors",
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
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-bordeaux shrink-0 mt-0.5"
            aria-hidden
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <span>Locked — remove confirmed speakers to change.</span>
        </div>
      )}
    </>
  );
}
