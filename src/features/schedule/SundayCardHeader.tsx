import { Link } from "@/lib/nav";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { KindVariant } from "./utils/kindLabel";
import { formatShortDate, formatCountdown, formatOpensOn } from "./utils/dateFormat";
import { SundayTypeMenu } from "./SundayTypeMenu";

interface Props {
  date: string;
  wardId: string;
  currentType: MeetingType;
  nonMeetingSundays: readonly NonMeetingSunday[];
  urgent?: boolean;
  badge?: string;
  variant?: KindVariant;
  locked?: boolean;
  /** False when this card is a future Sunday (or any non-upcoming
   *  Sunday). The date text loses its link, the countdown switches
   *  to an "Opens Mon, X" hint, and the type menu locks out edits. */
  editable?: boolean;
}

const BADGE_CLS: Record<KindVariant, string> = {
  regular: "",
  fast: "text-brass-deep border-brass-soft bg-[rgba(224,190,135,0.22)]",
  stake: "text-bordeaux border-danger-soft bg-danger-soft",
  general: "text-bordeaux border-danger-soft bg-danger-soft",
};

export function SundayCardHeader({
  date,
  wardId,
  currentType,
  nonMeetingSundays,
  urgent,
  badge,
  variant = "regular",
  locked = false,
  editable = true,
}: Props) {
  const dateLabel = formatShortDate(date);
  const dateClass =
    "text-2xl font-display font-semibold text-walnut leading-tight transition-colors";
  return (
    <div className="flex items-start justify-between gap-3 p-4 pb-2">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          {editable ? (
            <Link
              to={`/week/${date}`}
              className={cn(
                dateClass,
                "hover:text-bordeaux-deep hover:underline underline-offset-4 decoration-from-font",
              )}
            >
              {dateLabel}
            </Link>
          ) : (
            <span className={cn(dateClass, "text-walnut-3")}>{dateLabel}</span>
          )}
          <div
            className={cn(
              "text-[11px] font-mono tracking-[0.08em] uppercase mt-1",
              !editable
                ? "text-walnut-3"
                : urgent
                  ? "text-bordeaux font-semibold"
                  : "text-walnut-3",
            )}
          >
            {editable ? formatCountdown(date) : formatOpensOn(date)}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 shrink-0">
        {badge && (
          <span
            className={cn(
              "font-mono text-[9.5px] uppercase tracking-[0.16em] px-2 py-0.75 border rounded-full whitespace-nowrap self-start mt-0.5",
              BADGE_CLS[variant],
            )}
          >
            {badge}
          </span>
        )}
        <SundayTypeMenu
          wardId={wardId}
          date={date}
          currentType={currentType}
          locked={locked || !editable}
          nonMeetingSundays={nonMeetingSundays}
        />
      </div>
    </div>
  );
}
