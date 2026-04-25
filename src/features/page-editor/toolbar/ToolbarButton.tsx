import { cn } from "@/lib/cn";

interface Props {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Toolbar pill button matching the bishopric-pwa design kit's
 *  `.tb-btn` shape — 32px tall, transparent until hover/pressed,
 *  active state paints accent-soft + bordeaux-deep text + bordeaux-soft
 *  border. Shared across every toolbar control that isn't a select
 *  or a stepper. */
export function ToolbarButton({ label, active, disabled, onClick, children, className }: Props) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={cn("tb-btn", className)}
    >
      {children}
    </button>
  );
}

/** 1px vertical hairline matching `.tb-divider` — separates groups
 *  inside the toolbar. */
export function ToolbarSep() {
  return <span aria-hidden className="tb-divider" />;
}
