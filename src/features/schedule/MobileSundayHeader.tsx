import { Link } from "@/lib/nav";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { cn } from "@/lib/cn";
import { type KindInfo, type KindVariant } from "./utils/kindLabel";
import { formatShortDate } from "./utils/dateFormat";
import { SundayTypeMenu } from "./SundayTypeMenu";

const BADGE_CLS: Record<KindVariant, string> = {
  regular: "",
  fast: "text-brass-deep border-brass-soft bg-[rgba(224,190,135,0.22)]",
  stake: "text-bordeaux border-danger-soft bg-danger-soft",
  general: "text-bordeaux border-danger-soft bg-danger-soft",
};

interface Props {
  date: string;
  type: MeetingType;
  kind: KindInfo;
  cancelled: boolean;
  countdown: string;
  urgent: boolean;
  hasConfirmedSpeaker: boolean;
  wardId: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
  isHero: boolean;
}

/** Mobile Sunday card header — date strip + countdown + kind badge +
 *  options menu. The hero variant promotes the countdown text into a
 *  bordeaux uppercase eyebrow above the date and bumps the date
 *  typography one tier; the compact variant keeps date + countdown on
 *  one inline row. Extracted from MobileSundayBlock to keep that file
 *  under the 150-line component limit. */
export function MobileSundayHeader(props: Props) {
  const { date, type, kind, cancelled, countdown, urgent, isHero } = props;
  return (
    <div className={cn("px-4 py-2.5 border-b border-border", isHero && "py-3")}>
      {isHero && (
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bordeaux font-semibold mb-1">
          {countdown}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <Link
            to={`/week/${date}`}
            className={cn(
              "font-display font-semibold text-walnut leading-none shrink-0",
              isHero ? "text-3xl" : "text-xl",
              cancelled && "line-through text-walnut-3",
            )}
          >
            {formatShortDate(date)}
          </Link>
          {!isHero && (
            <span
              className={cn(
                "font-mono text-[10px] tracking-[0.08em] uppercase truncate",
                urgent ? "text-bordeaux font-semibold" : "text-walnut-3",
              )}
            >
              {countdown}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {kind.compact && (
            <span
              className={cn(
                "font-mono text-[9.5px] uppercase tracking-[0.16em] px-2 py-0.75 border rounded-full whitespace-nowrap",
                BADGE_CLS[kind.variant],
              )}
            >
              {kind.compact}
            </span>
          )}
          <SundayTypeMenu
            wardId={props.wardId}
            date={date}
            currentType={type}
            locked={props.hasConfirmedSpeaker}
            nonMeetingSundays={props.nonMeetingSundays}
          />
        </div>
      </div>
    </div>
  );
}
