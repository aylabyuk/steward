import { Link } from "react-router";
import { useSpeakers } from "@/hooks/useMeeting";
import { useSundayInvitationsSummary } from "@/features/invitations/hooks/useSundayInvitationsSummary";
import { leadTimeSeverity } from "@/features/speakers/utils/leadTime";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { cn } from "@/lib/cn";
import { kindLabel, type KindVariant } from "./utils/kindLabel";
import { formatShortDate, formatCountdown } from "./utils/dateFormat";
import { SundayTypeMenu } from "./SundayTypeMenu";
import { SundayCardSpecial } from "./SundayCardSpecial";
import { MobileSundayBody } from "./MobileSundayBody";

const ROW_BG: Record<KindVariant, string> = {
  regular: "bg-chalk",
  fast: "bg-chalk bg-[linear-gradient(180deg,rgba(224,190,135,0.14),rgba(224,190,135,0.04))]",
  stake: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
  general: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
};

const BADGE_CLS: Record<KindVariant, string> = {
  regular: "",
  fast: "text-brass-deep border-brass-soft bg-[rgba(224,190,135,0.22)]",
  stake: "text-bordeaux border-danger-soft bg-danger-soft",
  general: "text-bordeaux border-danger-soft bg-danger-soft",
};

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  fallbackType: MeetingType;
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function MobileSundayBlock({
  date,
  meeting,
  fallbackType,
  leadTimeDays,
  nonMeetingSundays,
}: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const type = meeting?.meetingType ?? fallbackType;
  const kind = kindLabel(type);
  const cancelled = Boolean(meeting?.cancellation?.cancelled);
  const { data: speakers } = useSpeakers(date);
  const { needsApply } = useSundayInvitationsSummary(wardId || null, date);
  const urgent = leadTimeSeverity(new Date(), date, leadTimeDays) === "urgent";
  const hasConfirmedSpeaker = speakers.some((s) => s.data.status === "confirmed");

  return (
    <article className={cn("border-b border-border", ROW_BG[kind.variant])}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2.5 bg-parchment/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <Link
            to={`/week/${date}`}
            className={cn(
              "font-display font-semibold text-walnut leading-none text-xl shrink-0",
              cancelled && "line-through text-walnut-3",
            )}
          >
            {formatShortDate(date)}
          </Link>
          <span
            className={cn(
              "font-mono text-[10px] tracking-[0.08em] uppercase truncate",
              urgent ? "text-bordeaux font-semibold" : "text-walnut-3",
            )}
          >
            {cancelled ? "Cancelled" : formatCountdown(date)}
          </span>
          {needsApply && !cancelled && (
            <span
              aria-label="Speaker response awaiting your review"
              className="inline-block w-2 h-2 rounded-full bg-bordeaux shrink-0"
            />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {kind.badge && (
            <span
              className={cn(
                "font-mono text-[9.5px] uppercase tracking-[0.16em] px-2 py-0.75 border rounded-full whitespace-nowrap",
                BADGE_CLS[kind.variant],
              )}
            >
              {kind.badge}
            </span>
          )}
          <SundayTypeMenu
            wardId={wardId}
            date={date}
            currentType={type}
            locked={hasConfirmedSpeaker}
            nonMeetingSundays={nonMeetingSundays}
            showPlanActions
          />
        </div>
      </div>

      <Body
        cancelled={cancelled}
        cancelReason={meeting?.cancellation?.reason}
        kind={kind}
        date={date}
        meeting={meeting ?? null}
        speakers={speakers}
      />
    </article>
  );
}

interface BodyProps {
  cancelled: boolean;
  cancelReason?: string;
  kind: ReturnType<typeof kindLabel>;
  date: string;
  meeting: SacramentMeeting | null;
  speakers: ReturnType<typeof useSpeakers>["data"];
}

function Body({ cancelled, cancelReason, kind, date, meeting, speakers }: BodyProps) {
  if (cancelled) {
    if (!cancelReason) return null;
    return (
      <p className="px-4 py-3 font-serif italic text-[13.5px] text-walnut-2 leading-normal">
        {cancelReason}
      </p>
    );
  }
  if (kind.isSpecial) {
    return (
      <SundayCardSpecial
        variant={kind.variant}
        stampLabel={kind.stampLabel}
        description={kind.description}
        date={date}
        meeting={meeting}
        hidePlanLink
      />
    );
  }
  return <MobileSundayBody date={date} meeting={meeting} speakers={speakers} />;
}
