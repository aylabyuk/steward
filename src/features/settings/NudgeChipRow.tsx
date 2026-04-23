import type { NudgeSchedule } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  value: NudgeSchedule;
  onChange: (next: NudgeSchedule) => void;
  disabled?: boolean;
}

const DAYS: readonly { key: keyof NudgeSchedule; label: string }[] = [
  { key: "wednesday", label: "Wed" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
];

const TIME_OPTS: readonly number[] = [7, 8, 9, 10, 12, 15, 17, 18, 19, 20, 21];

/** Pill chips matching the Ward-settings design. Each chip has a
 *  round check toggle and a compact time-of-day select; the select
 *  also flips the chip on when a disabled chip's time is touched. */
export function NudgeChipRow({ value, onChange, disabled }: Props): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map(({ key, label }) => {
        const slot = value[key];
        const on = slot.enabled;
        return (
          <div
            key={key}
            className={cn(
              "inline-flex items-stretch rounded-full border overflow-hidden transition-colors",
              on
                ? "bg-chalk border-bordeaux/35 shadow-[inset_0_0_0_1px_rgba(139,46,42,0.25)]"
                : "bg-parchment border-border opacity-70",
              disabled && "cursor-not-allowed",
            )}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, [key]: { ...slot, enabled: !on } })}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 font-sans text-[13px] font-semibold",
                on ? "text-bordeaux-deep" : "text-walnut-2",
                disabled && "cursor-not-allowed",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border",
                  on
                    ? "bg-success border-success text-chalk"
                    : "bg-chalk border-walnut-3 text-chalk",
                )}
              >
                {on && (
                  <svg
                    viewBox="0 0 24 24"
                    width="8"
                    height="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
              {label}
            </button>
            <select
              value={slot.hour}
              disabled={disabled}
              onChange={(e) => {
                const hour = Number(e.target.value);
                onChange({ ...value, [key]: { enabled: true, hour } });
              }}
              aria-label={`Nudge time for ${label}`}
              className={cn(
                "border-l border-dashed border-border bg-transparent font-mono text-[13px] px-3 pr-6 cursor-pointer focus:outline-none focus:text-bordeaux-deep",
                on ? "text-walnut" : "text-walnut-3",
              )}
            >
              {TIME_OPTS.map((h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
