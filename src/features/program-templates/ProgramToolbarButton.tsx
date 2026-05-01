import { cn } from "@/lib/cn";

interface Props {
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
  ariaPressed?: boolean;
}

const BTN =
  "h-8 min-w-8 px-2 grid place-items-center rounded-md text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-sans text-[13px]";
const BTN_ACTIVE = "bg-parchment-2 text-walnut";

/** Single toolbar button. Extracted so the parent toolbar stays under
 *  the 150-LOC cap. */
export function ProgramToolbarButton({
  label,
  onClick,
  disabled,
  active,
  ariaLabel,
  ariaPressed,
}: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(BTN, active && BTN_ACTIVE)}
    >
      {label}
    </button>
  );
}

export function ToolbarSep() {
  return <span aria-hidden className="mx-1 w-px h-5 bg-border" />;
}
