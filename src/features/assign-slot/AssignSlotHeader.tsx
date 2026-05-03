import {
  HEADER_CLOSE_BUTTON_CLASSES,
  HeaderCloseButton,
  HeaderCloseIcon,
} from "@/components/ui/HeaderCloseButton";
import { Link } from "@/lib/nav";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string | undefined;
  /** When provided, the cancel control fires this callback instead of
   *  routing. AssignSlotForm wires it to gate close on dirty-form
   *  discard confirm. Without it, the control falls back to a plain
   *  Link to /schedule (used by the page's not-found / loading
   *  branches where there's nothing to discard). */
  onCancel?: () => void;
}

/** Sticky header for the per-row Assign + Invite pages. Eyebrow
 *  carries the slot context ("Edit speaker"), title carries the
 *  speaker / prayer-giver name, subtitle carries the meeting date.
 *  Right side is the labeled Cancel control — replaces the prior
 *  14px walnut-3 "×" that users couldn't find. */
export function AssignSlotHeader({ eyebrow, title, subtitle, onCancel }: Props) {
  return (
    <header className="sticky top-0 z-20 shrink-0 flex items-start justify-between gap-3 border-b border-border bg-chalk px-4 sm:px-8 py-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
          {eyebrow}
        </div>
        <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-walnut leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="font-serif italic text-[12.5px] text-walnut-3 truncate">{subtitle}</p>
        )}
      </div>
      {onCancel ? (
        <HeaderCloseButton
          onClick={onCancel}
          label="Cancel"
          ariaLabel="Cancel and return to schedule"
        />
      ) : (
        <Link
          to="/schedule"
          aria-label="Cancel and return to schedule"
          className={HEADER_CLOSE_BUTTON_CLASSES}
        >
          <HeaderCloseIcon />
          <span>Cancel</span>
        </Link>
      )}
    </header>
  );
}
