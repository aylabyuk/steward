import { Link } from "@/lib/nav";
import { cn } from "@/lib/cn";

interface MenuLinkProps {
  to: string;
  onClick: () => void;
  newTab?: boolean;
  children: React.ReactNode;
}

export function MenuLink({ to, onClick, newTab, children }: MenuLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      role="menuitem"
      className="block px-2.5 py-2 text-sm text-walnut transition-colors hover:rounded hover:bg-parchment-2"
    >
      {children}
      {newTab && (
        <span
          aria-label="Opens in a new tab"
          className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-walnut-3"
        >
          ↗
        </span>
      )}
    </Link>
  );
}

interface MenuItemDisabledProps {
  label: string;
  hint?: string;
}

export function MenuItemDisabled({ label, hint }: MenuItemDisabledProps) {
  return (
    <div
      role="menuitem"
      aria-disabled="true"
      className="flex items-center justify-between px-2.5 py-2 text-sm text-walnut-3 cursor-not-allowed"
    >
      <span>{label}</span>
      {hint && (
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-walnut-3">
          {hint}
        </span>
      )}
    </div>
  );
}

interface MenuLinkWithToggleProps {
  to: string;
  onClickLink: () => void;
  label: string;
  toggleChecked: boolean;
  toggleDisabled?: boolean;
  toggleAriaLabel: string;
  onToggleChange: (next: boolean) => void;
}

/** Menu row that pairs a navigation link with a compact toggle on the
 *  right. Clicking the row text navigates; clicking the switch toggles
 *  without navigating. */
export function MenuLinkWithToggle({
  to,
  onClickLink,
  label,
  toggleChecked,
  toggleDisabled,
  toggleAriaLabel,
  onToggleChange,
}: MenuLinkWithToggleProps) {
  return (
    <div className="flex items-center pr-2.5 hover:bg-parchment-2 hover:rounded">
      <Link
        to={to}
        onClick={onClickLink}
        role="menuitem"
        className="flex-1 px-2.5 py-2 text-sm text-walnut transition-colors"
      >
        {label}
      </Link>
      <button
        type="button"
        role="switch"
        aria-checked={toggleChecked}
        aria-label={toggleAriaLabel}
        disabled={toggleDisabled}
        onClick={(e) => {
          e.stopPropagation();
          onToggleChange(!toggleChecked);
        }}
        className={cn(
          "relative w-[34px] h-[20px] rounded-full border transition-colors shrink-0",
          "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3.5 after:h-3.5 after:rounded-full after:bg-chalk after:shadow-[0_1px_2px_rgba(35,24,21,0.2)] after:transition-all",
          toggleChecked
            ? "bg-bordeaux border-bordeaux-deep after:left-[16px]"
            : "bg-parchment-3 border-border-strong",
          toggleDisabled && "opacity-60 cursor-not-allowed",
        )}
      />
    </div>
  );
}
