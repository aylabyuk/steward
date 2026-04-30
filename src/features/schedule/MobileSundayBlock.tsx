import { useSpeakers } from "@/hooks/useMeeting";
import { useSundayInvitationsSummary } from "@/features/invitations/hooks/useSundayInvitationsSummary";
import { leadTimeSeverity } from "@/features/speakers/utils/leadTime";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { cn } from "@/lib/cn";
import { kindLabel, type KindVariant } from "./utils/kindLabel";
import { formatCountdown } from "./utils/dateFormat";
import { MobileSundayHeader } from "./MobileSundayHeader";
import { MobileSundayHeroSummary } from "./MobileSundayHeroSummary";
import { SundayCardSpecial } from "./SundayCardSpecial";
import { MobileSundayBody } from "./MobileSundayBody";

const ROW_BG: Record<KindVariant, string> = {
  regular: "bg-chalk",
  fast: "bg-chalk bg-[linear-gradient(180deg,rgba(224,190,135,0.14),rgba(224,190,135,0.04))]",
  stake: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
  general: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
};

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  fallbackType: MeetingType;
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
  /** First card across the schedule. Renders the hero treatment:
   *  bordeaux-eyebrow countdown above the date, larger date typography,
   *  per-kind summary line ("X of Y confirmed") below, and a 1.5pt
   *  bordeaux stroke on the chalk surface. Only mobile passes this —
   *  desktop has no equivalent affordance. */
  isHero?: boolean;
}

export function MobileSundayBlock({
  date,
  meeting,
  fallbackType,
  leadTimeDays,
  nonMeetingSundays,
  isHero = false,
}: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const type = meeting?.meetingType ?? fallbackType;
  const kind = kindLabel(type);
  const cancelled = Boolean(meeting?.cancellation?.cancelled);
  const { data: speakers } = useSpeakers(date);
  const { needsApply } = useSundayInvitationsSummary(wardId || null, date);
  const urgent = leadTimeSeverity(new Date(), date, leadTimeDays) === "urgent";
  const hasConfirmedSpeaker = speakers.some((s) => s.data.status === "confirmed");
  const countdown = cancelled ? "Cancelled" : formatCountdown(date);

  return (
    <article
      className={cn(
        "rounded-lg overflow-hidden border shadow-[0_1px_2px_rgba(58,37,25,0.06)]",
        ROW_BG[kind.variant],
        isHero ? "border-bordeaux/70 border-[1.5px]" : "border-border",
      )}
    >
      <MobileSundayHeader
        date={date}
        type={type}
        kind={kind}
        cancelled={cancelled}
        countdown={countdown}
        urgent={urgent}
        needsApply={needsApply}
        hasConfirmedSpeaker={hasConfirmedSpeaker}
        wardId={wardId}
        nonMeetingSundays={nonMeetingSundays}
        isHero={isHero}
      />

      {isHero && !cancelled && (
        <MobileSundayHeroSummary
          date={date}
          variant={kind.variant}
          speakers={speakers}
          meeting={meeting}
        />
      )}

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
