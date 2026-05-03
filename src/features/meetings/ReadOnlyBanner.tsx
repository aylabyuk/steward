import { Link } from "@/lib/nav";
import { formatShortSunday } from "@/features/schedule/utils/dateFormat";

interface Props {
  /** ISO date of the meeting being viewed. */
  viewingDate: string;
  /** ISO of the Sunday currently open for planning. */
  upcoming: string;
}

/** Banner shown at the top of `WeekEditor` when the loaded date isn't
 *  the upcoming Sunday. The sacrament meeting program form is locked
 *  for non-upcoming weeks — past meetings stay viewable for archive
 *  (printable copies, history), and future Sundays are previewable.
 *  Speakers and prayers stay plannable from the schedule for any
 *  Sunday, so the link points back there. */
export function ReadOnlyBanner({ viewingDate, upcoming }: Props) {
  const isPast = viewingDate < upcoming;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-info-soft bg-[linear-gradient(180deg,rgba(60,85,100,0.08),rgba(60,85,100,0.02))] px-4 py-3">
      <LockIcon />
      <p className="font-sans text-[13.5px] text-walnut flex-1 min-w-0 leading-snug">
        {isPast
          ? "Past meeting — program is view-only."
          : "Program planning isn't open for this Sunday yet."}{" "}
        Sacrament meeting program planning is open for{" "}
        <strong className="font-semibold">{formatShortSunday(upcoming)}</strong>. Speakers and
        prayers can still be planned from the schedule.
      </p>
      <Link
        to={`/schedule?focus=${viewingDate}`}
        className="font-sans text-[13px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors whitespace-nowrap"
      >
        Back to schedule
      </Link>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-info shrink-0"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
