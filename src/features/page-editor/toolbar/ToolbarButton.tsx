import { cn } from "@/lib/cn";

interface Props {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Shared pill-style button used across the page-editor toolbar.
 *  `active` paints the walnut-on-parchment "pressed" look matching
 *  the floating-selection toolbar buttons. */
export function ToolbarButton({ label, active, disabled, onClick, children, className }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "h-8 min-w-8 px-2 rounded-md grid place-items-center text-[13px] text-walnut hover:bg-parchment-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        active && "bg-walnut text-parchment hover:bg-walnut-2 hover:text-parchment",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ToolbarSep() {
  return <span aria-hidden className="mx-1 w-px h-5 bg-border" />;
}
