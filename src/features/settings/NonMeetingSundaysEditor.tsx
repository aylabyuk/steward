import { useRef, useState } from "react";
import { type MeetingType, type NonMeetingSunday, nonMeetingSundaySchema } from "@/lib/types";

const TYPE_OPTIONS: { value: MeetingType; label: string }[] = [
  { value: "stake_conference", label: "Stake conference" },
  { value: "general_conference", label: "General conference" },
  { value: "other", label: "Other (no meeting)" },
];

interface Props {
  value: readonly NonMeetingSunday[];
  onChange: (next: NonMeetingSunday[]) => void;
  disabled?: boolean;
}

function Row({
  entry,
  onChange,
  onRemove,
  disabled,
}: {
  entry: NonMeetingSunday;
  onChange: (next: NonMeetingSunday) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        type="date"
        value={entry.date}
        onChange={(e) => onChange({ ...entry, date: e.target.value })}
        disabled={disabled}
        className="rounded-md border border-slate-300 px-2 py-1"
      />
      <select
        value={entry.type}
        onChange={(e) => onChange({ ...entry, type: e.target.value as MeetingType })}
        disabled={disabled}
        className="rounded-md border border-slate-300 px-2 py-1"
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        value={entry.note ?? ""}
        onChange={(e) => onChange({ ...entry, note: e.target.value || undefined })}
        placeholder="Note (optional)"
        disabled={disabled}
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-50"
      >
        Remove
      </button>
    </div>
  );
}

export function NonMeetingSundaysEditor({ value, onChange, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);
  const idsRef = useRef<string[]>([]);
  while (idsRef.current.length < value.length) {
    idsRef.current.push(crypto.randomUUID());
  }
  if (idsRef.current.length > value.length) {
    idsRef.current.length = value.length;
  }

  function update(idx: number, next: NonMeetingSunday) {
    const copy = [...value];
    copy[idx] = next;
    onChange(copy);
  }
  function remove(idx: number) {
    idsRef.current.splice(idx, 1);
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    const today = new Date().toISOString().slice(0, 10);
    const draft = { date: today, type: "stake_conference" as MeetingType };
    const parsed = nonMeetingSundaySchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.message);
      return;
    }
    setError(null);
    onChange([...value, parsed.data]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 && (
        <p className="text-xs text-slate-500">
          No exceptions configured. Add dates the ward replaces sacrament meeting (e.g. stake or
          general conference Sundays).
        </p>
      )}
      {value.map((entry, idx) => (
        <Row
          key={idsRef.current[idx]}
          entry={entry}
          onChange={(next) => update(idx, next)}
          onRemove={() => remove(idx)}
          disabled={disabled ?? false}
        />
      ))}
      <div>
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          Add date
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
