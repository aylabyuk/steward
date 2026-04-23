import { cn } from "@/lib/cn";

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Rendered next to the label when set — e.g. the "Coming soon"
   *  chip on category rows we haven't wired yet. */
  badge?: string;
}

/** Iconic toggle switch matching the Profile design prototype. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  badge,
}: Props): React.ReactElement {
  return (
    <label
      className={cn(
        "flex items-start gap-3 py-1",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative mt-0.5 w-[34px] h-[20px] rounded-full border transition-colors flex-shrink-0",
          "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3.5 after:h-3.5 after:rounded-full after:bg-chalk after:shadow-[0_1px_2px_rgba(35,24,21,0.2)] after:transition-all",
          checked
            ? "bg-bordeaux border-bordeaux-deep after:left-[16px]"
            : "bg-parchment-3 border-border-strong",
        )}
      />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-sans text-[13.5px] text-walnut">{label}</span>
          {badge && (
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 bg-parchment-2 text-walnut-3 border border-border rounded-full">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="block font-serif italic text-[12.5px] text-walnut-3 mt-0.5">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
