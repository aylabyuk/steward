interface Props {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: string;
}

/** Compact labeled input used by `PrayerPlanCard`. Matches the
 *  parchment-on-chalk treatment of the meeting editor's `AssignRow`
 *  so the plan-prayers page reads as the same family. */
export function PrayerPlanField({ label, value, onChange, placeholder, type = "text" }: Props) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className="font-sans text-[14px] px-2.5 py-1.5 bg-parchment border border-transparent rounded-md text-walnut w-full hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15"
      />
    </label>
  );
}
