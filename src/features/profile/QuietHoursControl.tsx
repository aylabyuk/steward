import type { NotificationPrefs } from "@/lib/types";
import { cn } from "@/lib/cn";
import { describeQuietWindow, hourToTime, timeToHour } from "./utils/quietHoursTime";
import { Switch } from "./Switch";

interface Props {
  prefs: NotificationPrefs;
  onPrefsChange: (next: NotificationPrefs) => void;
}

/** Quiet-hours control: enable switch + from/to time inputs + a
 *  human-readable "overnight / same day" hint. Stores hour-granular
 *  integers on the doc; the <input type="time"> surfaces "HH:MM" but
 *  the minutes are discarded on save. */
export function QuietHoursControl({ prefs, onPrefsChange }: Props): React.ReactElement {
  const quiet = prefs.quietHours;

  function toggle(on: boolean) {
    if (on) {
      onPrefsChange({
        ...prefs,
        quietHours: prefs.quietHours ?? { startHour: 21, endHour: 7 },
      });
    } else {
      const { quietHours: _qh, ...rest } = prefs;
      onPrefsChange(rest);
    }
  }

  function setHour(key: "startHour" | "endHour", value: string) {
    const h = timeToHour(value);
    if (h === null || !prefs.quietHours) return;
    onPrefsChange({ ...prefs, quietHours: { ...prefs.quietHours, [key]: h } });
  }

  return (
    <div className="flex flex-col gap-2 pt-3.5">
      <div className="font-sans text-[13.5px] font-semibold text-walnut flex items-center gap-2">
        <MoonIcon />
        Quiet hours
        <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5 w-full">
          Silence push notifications during a daily window.
        </span>
      </div>
      <Switch
        checked={Boolean(quiet)}
        onChange={toggle}
        label="Suppress notifications during a daily window"
      />
      <div
        className={cn(
          "mt-2 px-4 py-3 bg-parchment border border-dashed border-border rounded-lg",
          !quiet && "opacity-55 pointer-events-none",
        )}
      >
        <p className="font-serif italic text-[13px] text-walnut-3">
          Notifications queued during this window are delivered once it ends.
        </p>
        <div className="flex items-center gap-2.5 mt-2.5 flex-wrap font-serif text-[14px] text-walnut-2">
          <em className="not-italic text-[13px] text-walnut-3">From</em>
          <input
            type="time"
            value={hourToTime(quiet?.startHour ?? 21)}
            onChange={(e) => setHour("startHour", e.target.value)}
            disabled={!quiet}
            className="font-mono text-[14px] font-semibold px-2.5 py-1.5 bg-chalk border border-border rounded text-bordeaux-deep w-[92px] text-center focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
          />
          <em className="not-italic text-[13px] text-walnut-3">to</em>
          <input
            type="time"
            value={hourToTime(quiet?.endHour ?? 7)}
            onChange={(e) => setHour("endHour", e.target.value)}
            disabled={!quiet}
            className="font-mono text-[14px] font-semibold px-2.5 py-1.5 bg-chalk border border-border rounded text-bordeaux-deep w-[92px] text-center focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15"
          />
          {quiet && (
            <em className="italic text-[13px] text-walnut-3">
              ({describeQuietWindow(quiet.startHour, quiet.endHour)})
            </em>
          )}
        </div>
      </div>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-walnut-2"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}
