import { Link } from "@/lib/nav";
import { formatShortSunday } from "./utils/dateFormat";

interface Props {
  /** ISO of the Sunday currently open for planning. */
  upcoming: string;
}

/** Schedule-page banner that communicates the one-Sunday-at-a-time
 *  rule for the sacrament meeting *program* (hymns, ward business,
 *  leaders, sacrament logistics). Speakers and prayers can still be
 *  planned for any Sunday on the schedule — that's the whole point
 *  of having a schedule. Sits under PageHead. */
export function UpcomingPlanningBanner({ upcoming }: Props) {
  return (
    <div className="my-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 rounded-xl border border-bordeaux-soft bg-[linear-gradient(180deg,rgba(139,46,42,0.06),rgba(139,46,42,0.01))] px-4 py-3">
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        <CalendarIcon />
        <p className="font-sans text-[13.5px] text-walnut flex-1 min-w-0 leading-snug">
          Sacrament meeting program planning is open for{" "}
          <strong className="font-semibold">{formatShortSunday(upcoming)}</strong>. Speakers and
          prayers can still be planned ahead from any card on the schedule.
        </p>
      </div>
      <Link
        to={`/week/${upcoming}`}
        className="font-sans text-[13px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors whitespace-nowrap self-end sm:self-auto"
      >
        Plan program →
      </Link>
    </div>
  );
}

function CalendarIcon() {
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
      className="text-bordeaux shrink-0"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
