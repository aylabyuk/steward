import { Link } from "@/lib/nav";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { KindVariant } from "./utils/kindLabel";
import { formatCountdown, formatShortDate } from "./utils/dateFormat";
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
}: Props) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 pb-2">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <Link
            to={`/week/${date}`}
            className="text-2xl font-display font-semibold text-walnut leading-tight hover:text-bordeaux-deep hover:underline underline-offset-4 decoration-from-font transition-colors"
          >
            {formatShortDate(date)}
          </Link>
          <div
            className={cn(
              "text-[11px] font-mono tracking-[0.08em] uppercase mt-1",
              urgent ? "text-bordeaux font-semibold" : "text-walnut-3",
            )}
          >
            {formatCountdown(date)}
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
          locked={locked}
          nonMeetingSundays={nonMeetingSundays}
        />
      </div>
    </div>
  );
}
