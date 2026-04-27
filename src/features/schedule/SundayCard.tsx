import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useSpeakers } from "@/hooks/useMeeting";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { cn } from "@/lib/cn";
import { kindLabel, type KindVariant } from "./kindLabel";
import { SundayCardBody } from "./SundayCardBody";
import { SundayCardCancelled } from "./SundayCardCancelled";
import { SundayCardHeader } from "./SundayCardHeader";
import { SundayCardSpecial } from "./SundayCardSpecial";
import { leadTimeSeverity } from "@/features/speakers/leadTime";

// Lead-time severity computation stays live (the urgent flag still
// styles the header's relative-time label in bordeaux); the banner
// UI is silenced for now. Original copy was:
//   warn:    "Less than 2 weeks notice — consider a later week."
//   urgent:  "Short notice — confirm speakers directly."
// Tracked for re-add — see GH issue.

const CARD_BG: Record<KindVariant, string> = {
  regular: "bg-chalk",
  fast: "bg-chalk bg-[linear-gradient(180deg,rgba(224,190,135,0.14),rgba(224,190,135,0.04))] border-brass-soft",
  stake: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
  general: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
};

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  fallbackType: MeetingType;
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function SundayCard({
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
  const severity = leadTimeSeverity(new Date(), date, leadTimeDays);
  const hasConfirmedSpeaker = speakers.some((s) => s.data.status === "confirmed");

  if (cancelled) {
    return (
      <SundayCardCancelled
        date={date}
        {...(meeting?.cancellation?.reason ? { reason: meeting.cancellation.reason } : {})}
      />
    );
  }

  return (
    <div className="relative h-full">
      <article
        className={cn(
          "relative flex h-full flex-col rounded-lg border border-border shadow-elev-1",
          CARD_BG[kind.variant],
        )}
      >
        <SundayCardHeader
          date={date}
          wardId={wardId}
          currentType={type}
          nonMeetingSundays={nonMeetingSundays}
          urgent={severity === "urgent"}
          {...(kind.badge ? { badge: kind.badge } : {})}
          variant={kind.variant}
          locked={hasConfirmedSpeaker}
        />

        {kind.isSpecial ? (
          <SundayCardSpecial
            variant={kind.variant}
            stampLabel={kind.stampLabel}
            description={kind.description}
            date={date}
            meeting={meeting ?? null}
          />
        ) : (
          <SundayCardBody speakers={speakers} date={date} meeting={meeting ?? null} />
        )}
      </article>
    </div>
  );
}
