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

const SEVERITY_TEXT: Record<"warn" | "urgent", string> = {
  warn: "Less than 2 weeks notice — consider a later week.",
  urgent: "Short notice — confirm speakers directly.",
};

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

  const showWarning = !kind.isSpecial && severity !== "none";

  return (
    <div className="relative h-full">
      {showWarning && (
        <div className="absolute -top-6 left-0 right-0 rounded-t-lg border border-b-0 border-danger-soft bg-danger-soft px-4 pt-1.5 pb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-bordeaux shrink-0" />
          <span className="text-[12px] text-bordeaux-deep leading-tight">
            {SEVERITY_TEXT[severity]}
          </span>
        </div>
      )}
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
