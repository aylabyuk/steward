import { cn } from "@/lib/cn";

interface Props {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  unit?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

/** Numeric stepper matching the Ward-settings design. Minus / typed
 *  input / plus, with a unit suffix. Clamps on each edit so the
 *  bound values can't escape via keyboard spam. */
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  unit,
  disabled,
  ariaLabel,
}: Props): React.ReactElement {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const set = (v: number) => onChange(clamp(v));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border-strong bg-parchment overflow-hidden focus-within:border-bordeaux focus-within:ring-2 focus-within:ring-bordeaux/15",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Decrement"
        className="w-8 h-8 text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        −
      </button>
      <input
        value={value}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/\D/g, "");
          set(cleaned === "" ? min : Number(cleaned));
        }}
        disabled={disabled}
        inputMode="numeric"
        aria-label={ariaLabel}
        className="w-12 font-mono text-[14px] font-semibold text-center bg-transparent text-walnut border-0 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increment"
        className="w-8 h-8 text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        +
      </button>
      {unit && (
        <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-walnut-3 px-3">
          {unit}
        </span>
      )}
    </div>
  );
}
