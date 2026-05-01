import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Helper / error line shown under the field. */
  hint?: string;
}

/** Compact labeled input used by `PrayerPlanCard`. Matches the
 *  parchment-on-chalk treatment of the meeting editor's `AssignRow`
 *  so the plan-prayers page reads as the same family. */
export function PrayerPlanField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  invalid = false,
  disabled = false,
  hint,
}: Props) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder ?? ""}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "font-sans text-[14px] px-2.5 py-1.5 bg-parchment border rounded-md text-walnut w-full focus:outline-none focus:bg-chalk focus:ring-2",
          "disabled:cursor-not-allowed disabled:bg-parchment-2 disabled:text-walnut-2 disabled:hover:bg-parchment-2",
          !disabled && "hover:bg-chalk",
          invalid
            ? "border-bordeaux focus:border-bordeaux focus:ring-bordeaux/25"
            : "border-transparent hover:border-border-strong focus:border-bordeaux focus:ring-bordeaux/15",
        )}
      />
      {hint && (
        <span
          className={cn(
            "font-sans text-[11.5px] mt-0.5",
            invalid ? "text-bordeaux" : "text-walnut-3",
          )}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
