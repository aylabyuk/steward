import { Link } from "@/lib/nav";
import { RemoveIcon } from "@/features/schedule/SpeakerInviteIcons";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string | undefined;
}

/** Sticky header for the per-row Assign + Invite pages. Eyebrow
 *  carries the slot context ("Assign speaker · 02"), title carries
 *  the action ("New speaker"), subtitle carries the meeting date.
 *  Cancel returns to the schedule. */
export function AssignSlotHeader({ eyebrow, title, subtitle }: Props) {
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
      <Link
        to="/schedule"
        aria-label="Cancel and return to schedule"
        title="Cancel"
        className="shrink-0 -mr-1 rounded-md p-2 text-walnut-3 hover:text-bordeaux hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30"
      >
        <RemoveIcon />
      </Link>
    </header>
  );
}
