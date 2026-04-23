import { useMemo } from "react";
import type { WardSettings } from "@/lib/types";
import { NudgeChipRow } from "./NudgeChipRow";
import { NumberStepper } from "./NumberStepper";
import { timezoneSuggestions } from "./timezone";
import { HORIZON_MAX, HORIZON_MIN, LEAD_MAX, LEAD_MIN } from "./wardSettingsValidate";

interface Props {
  value: WardSettings;
  onChange: (next: WardSettings) => void;
  canEdit: boolean;
}

/** Ward Settings → Schedule preferences card. Controlled: the parent
 *  page owns the draft + savebar; this component only renders fields. */
export function WardPrefsSection({ value, onChange, canEdit }: Props): React.ReactElement {
  const tzOptions = useMemo(() => timezoneSuggestions(), []);

  function patch<K extends keyof WardSettings>(key: K, v: WardSettings[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <section
      id="sec-ward"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        Ward
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Schedule preferences
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        Timezone, lead times, and finalization nudges for the bishopric.
      </p>

      <FieldRow label="Timezone" sub="Used for all reminders and prints.">
        <select
          value={value.timezone}
          disabled={!canEdit}
          onChange={(e) => patch("timezone", e.target.value)}
          className="font-sans text-[14px] w-full max-w-md px-2.5 py-1.5 bg-parchment border border-border rounded-md text-walnut hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15 disabled:opacity-60"
        >
          {tzOptions.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Speaker lead time" sub="How far in advance speakers are asked.">
        <NumberStepper
          value={value.speakerLeadTimeDays}
          onChange={(v) => patch("speakerLeadTimeDays", v)}
          min={LEAD_MIN}
          max={LEAD_MAX}
          unit="days"
          disabled={!canEdit}
          ariaLabel="Speaker lead time in days"
        />
      </FieldRow>

      <FieldRow label="Schedule horizon" sub="Weeks visible on the schedule by default.">
        <NumberStepper
          value={value.scheduleHorizonWeeks}
          onChange={(v) => patch("scheduleHorizonWeeks", v)}
          min={HORIZON_MIN}
          max={HORIZON_MAX}
          unit="weeks"
          disabled={!canEdit}
          ariaLabel="Schedule horizon in weeks"
        />
      </FieldRow>

      <StackedRow
        label="Finalization nudges"
        sub="Email reminders sent to the bishopric until the program is approved."
        lastRow
      >
        <NudgeChipRow
          value={value.nudgeSchedule}
          onChange={(next) => patch("nudgeSchedule", next)}
          disabled={!canEdit}
        />
        <p className="font-serif italic text-[12.5px] text-walnut-3 mt-2">
          Pick the days and times when incomplete programs should prompt a reminder.
        </p>
      </StackedRow>
    </section>
  );
}

function FieldRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid sm:grid-cols-[200px_1fr] gap-y-2 sm:gap-x-6 py-3.5 border-b border-dashed border-border">
      <label className="font-sans text-[13.5px] font-semibold text-walnut pt-1.5">
        {label}
        {sub && (
          <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5">
            {sub}
          </span>
        )}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function StackedRow({
  label,
  sub,
  lastRow,
  children,
}: {
  label: string;
  sub?: string;
  lastRow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-2 py-3.5 ${lastRow ? "" : "border-b border-dashed border-border"}`}
    >
      <div className="font-sans text-[13.5px] font-semibold text-walnut">
        {label}
        {sub && (
          <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5">
            {sub}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
