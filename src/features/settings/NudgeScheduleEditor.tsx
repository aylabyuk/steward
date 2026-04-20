import type { NudgeSchedule, NudgeSlot } from "@/lib/types";

const DAYS: { key: keyof NudgeSchedule; label: string }[] = [
  { key: "wednesday", label: "Wed" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
];

interface Props {
  value: NudgeSchedule;
  onChange: (next: NudgeSchedule) => void;
  disabled?: boolean;
}

function SlotRow({
  label,
  slot,
  onChange,
  disabled,
}: {
  label: string;
  slot: NudgeSlot;
  onChange: (next: NudgeSlot) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <label className="flex w-24 items-center gap-2">
        <input
          type="checkbox"
          checked={slot.enabled}
          onChange={(e) => onChange({ ...slot, enabled: e.target.checked })}
          disabled={disabled}
        />
        <span>{label}</span>
      </label>
      <select
        value={slot.hour}
        onChange={(e) => onChange({ ...slot, hour: Number(e.target.value) })}
        disabled={disabled || !slot.enabled}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>
            {h.toString().padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </div>
  );
}

export function NudgeScheduleEditor({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {DAYS.map(({ key, label }) => (
        <SlotRow
          key={key}
          label={label}
          slot={value[key]}
          onChange={(next) => onChange({ ...value, [key]: next })}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
