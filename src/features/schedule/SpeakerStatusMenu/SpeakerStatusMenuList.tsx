import { forwardRef } from "react";
import { SPEAKER_STATUSES, type SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATE_LABELS: Record<SpeakerStatus, string> = {
  planned: "Planned",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
};

interface Props {
  status: SpeakerStatus;
  position: { top: number; left: number } | { top: number; right: number };
  onPick: (next: SpeakerStatus) => void;
}

/** Portal-positioned dropdown body for `SpeakerStatusMenu`. Split out
 *  to keep the parent under the 150-LOC ceiling and to give the
 *  outside-click handler a stable ref to forward. */
export const SpeakerStatusMenuList = forwardRef<HTMLUListElement, Props>(
  function SpeakerStatusMenuList({ status, position, onPick }, ref) {
    const style: React.CSSProperties = { position: "fixed", top: position.top };
    if ("left" in position) style.left = position.left;
    else style.right = position.right;
    return (
      <ul
        ref={ref}
        role="menu"
        style={style}
        className="min-w-44 bg-chalk border border-border rounded-lg shadow-[0_10px_28px_rgba(58,37,25,0.12),0_2px_6px_rgba(58,37,25,0.06)] p-1.5 z-50 list-none m-0 animate-[menuIn_120ms_ease-out]"
      >
        {SPEAKER_STATUSES.map((s) => {
          const active = s === status;
          const destructive = s === "declined";
          return (
            <li key={s} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => onPick(s)}
                className={cn(
                  "w-full flex items-center gap-2 font-sans text-[13px] px-3 py-1.5 rounded-sm transition-colors",
                  destructive
                    ? "text-bordeaux hover:bg-danger-soft"
                    : "text-walnut hover:bg-parchment",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-block w-3.5 text-walnut-3 leading-none",
                    active && "text-walnut",
                  )}
                >
                  {active ? "✓" : ""}
                </span>
                {destructive ? "Mark as Declined" : STATE_LABELS[s]}
              </button>
            </li>
          );
        })}
      </ul>
    );
  },
);
