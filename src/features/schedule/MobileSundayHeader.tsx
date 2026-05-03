import { Link } from "@/lib/nav";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { cn } from "@/lib/cn";
import { type KindInfo, type KindVariant } from "./utils/kindLabel";
import { formatOpensOn, formatShortDate } from "./utils/dateFormat";
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
  /** False when this card is a future Sunday (or any non-upcoming
   *  Sunday). The date text loses its link, the countdown switches to
   *  an "Opens Mon, X" hint, and the type menu locks out edits. */
  editable?: boolean;
}

/** Mobile Sunday card header — date strip + countdown + kind badge +
 *  options menu. The hero variant promotes the countdown text into a
 *  bordeaux uppercase eyebrow above the date and bumps the date
 *  typography one tier; the compact variant keeps date + countdown on
 *  one inline row. Extracted from MobileSundayBlock to keep that file
 *  under the 150-line component limit. */
export function MobileSundayHeader(props: Props) {
  const { date, type, kind, cancelled, countdown, urgent, isHero, editable = true } = props;
  const dateLabel = formatShortDate(date);
  const dateClass = cn(
    "font-display font-semibold leading-none shrink-0",
    isHero ? "text-3xl" : "text-xl",
    cancelled ? "line-through text-walnut-3" : editable ? "text-walnut" : "text-walnut-3",
  );
  const countdownText = editable ? countdown : formatOpensOn(date);
  const countdownClass = cn(
    "font-mono text-[10px] tracking-[0.08em] uppercase truncate",
    !editable ? "text-walnut-3" : urgent ? "text-bordeaux font-semibold" : "text-walnut-3",
  );
  return (
    <div className={cn("px-4 py-2.5 border-b border-border", isHero && "py-3")}>
      {isHero && (
        <div
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.16em] mb-1",
            editable ? "text-bordeaux font-semibold" : "text-walnut-3",
          )}
        >
          {countdownText}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          {editable ? (
            <Link to={`/week/${date}`} className={dateClass}>
              {dateLabel}
            </Link>
          ) : (
            <span className={dateClass}>{dateLabel}</span>
          )}
          {!isHero && <span className={countdownClass}>{countdownText}</span>}
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
            locked={props.hasConfirmedSpeaker || !editable}
            nonMeetingSundays={props.nonMeetingSundays}
          />
        </div>
      </div>
    </div>
  );
}
