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
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel and return to schedule"
          aria-keyshortcuts="Escape"
          className={CANCEL_CLASSES}
        >
          <CancelIcon />
          <span>Cancel</span>
        </button>
      ) : (
        <Link to="/schedule" aria-label="Cancel and return to schedule" className={CANCEL_CLASSES}>
          <CancelIcon />
          <span>Cancel</span>
        </Link>
      )}
    </header>
  );
}

const CANCEL_CLASSES =
  "shrink-0 inline-flex items-center gap-1.5 min-h-11 rounded-md px-2.5 py-2 font-sans text-[13px] font-medium text-walnut-2 hover:text-bordeaux hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30";

function CancelIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
