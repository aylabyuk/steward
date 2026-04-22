import { Link } from "react-router";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useSundayInvitationsSummary } from "@/features/invitations/useSundayInvitationsSummary";
import type { KindVariant } from "./kindLabel";
import { formatShortDate, formatCountdown } from "./dateFormat";
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
  /** When supplied, the "needs apply" bordeaux dot renders as a
   *  tappable button that calls this handler (plus kills the link
   *  navigation underneath). Typically opens the Assign Speakers
   *  modal straight to step 2. */
  onReviewResponse?: () => void;
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
  onReviewResponse,
}: Props) {
  const { needsApply } = useSundayInvitationsSummary(wardId || null, date);
  return (
    <div className="flex items-start justify-between gap-3 p-4 pb-2">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <Link to={`/week/${date}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="text-2xl font-display font-semibold text-walnut leading-tight">
            {formatShortDate(date)}
          </div>
          <div
            className={cn(
              "text-[11px] font-mono tracking-[0.08em] uppercase mt-1",
              urgent ? "text-bordeaux font-semibold" : "text-walnut-3",
            )}
          >
            {formatCountdown(date)}
          </div>
        </Link>
        {needsApply &&
          (onReviewResponse ? (
            <button
              type="button"
              onClick={onReviewResponse}
              aria-label="Review speaker response"
              title="Review speaker response"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-bordeaux-deep bg-bordeaux text-parchment px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] hover:bg-bordeaux-deep transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-parchment" />
              Review
            </button>
          ) : (
            <span
              aria-label="Speaker response awaiting your review"
              title="Speaker response awaiting your review"
              className="mt-2.5 inline-block w-2 h-2 rounded-full bg-bordeaux"
            />
          ))}
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
