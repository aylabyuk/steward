import { Link } from "@/lib/nav";
import { cn } from "@/lib/cn";

interface Props {
  /** Mono-brass leading label — the speaker number ("01"…"04") or the
   *  prayer role ("OP" / "CP"). */
  leadingLabel: string;
  /** Width class for the leading column so the leading label aligns
   *  with the filled rows above it. */
  leadingWidthCls?: string;
  /** Verb shown inside the pill — e.g. "Assign Speaker", "Assign
   *  Opening Prayer", "Assign Closing Prayer". The pill is the entry
   *  point to the per-row Assign + Invite flow. */
  label: string;
  /** Route the row navigates to on tap. */
  to: string;
}

/** Roster placeholder row for empty speaker + prayer slots. Replaces
 *  the inert "Not assigned" text with a tappable parchment-2 pill —
 *  brass `+` glyph + walnut verb — so the row reads as the invitation
 *  to act. Same height + leading-column rhythm as a filled row. */
export function EmptyRosterRow({ leadingLabel, leadingWidthCls = "w-6", label, to }: Props) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to={to}
        className="flex items-center gap-3 h-16 group/empty hover:bg-parchment-2 transition-colors"
      >
        <div
          className={cn(
            "font-mono text-[10.5px] tracking-[0.08em] text-brass-deep shrink-0",
            leadingWidthCls,
          )}
        >
          {leadingLabel}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-brass bg-parchment-2 text-brass-deep shrink-0">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-sans text-sm text-walnut-2 group-hover/empty:text-walnut truncate">
            {label}
          </span>
        </div>
      </Link>
    </li>
  );
}
