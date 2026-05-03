import { useEffect, useRef } from "react";
import { useSpeakers } from "@/hooks/useMeeting";
import { leadTimeSeverity } from "@/features/speakers/utils/leadTime";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { cn } from "@/lib/cn";
import { kindLabel, type KindVariant } from "./utils/kindLabel";
import { formatCountdownCompact } from "./utils/dateFormat";
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
  /** Set when this block matches `?focus=<date>` on the schedule
   *  route. Triggers a smooth scrollIntoView + a one-shot ring flash
   *  so the bishop's eye lands on the right card after arriving from
   *  the meeting program form. */
  focused?: boolean;
  /** False when this Sunday isn't the upcoming one — the body becomes
   *  inert (interactive controls disabled), the date stops linking
   *  out, and the type menu locks. Keeps the card visible so
   *  leadership sees what's coming, without inviting edits. */
  editable?: boolean;
}

export function MobileSundayBlock({
  date,
  meeting,
  fallbackType,
  leadTimeDays,
  nonMeetingSundays,
  isHero = false,
  focused = false,
  editable = true,
}: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const type = meeting?.meetingType ?? fallbackType;
  const kind = kindLabel(type);
  const cancelled = Boolean(meeting?.cancellation?.cancelled);
  const { data: speakers } = useSpeakers(date);
  const urgent = leadTimeSeverity(new Date(), date, leadTimeDays) === "urgent";
  const hasConfirmedSpeaker = speakers.some((s) => s.data.status === "confirmed");
  const countdown = cancelled ? "Cancelled" : formatCountdownCompact(date);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!focused) return;
    const el = ref.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [focused]);

  return (
    <article
      ref={ref}
      id={`sunday-${date}`}
      className={cn(
        "rounded-lg overflow-hidden border shadow-[0_1px_2px_rgba(58,37,25,0.06)]",
        ROW_BG[kind.variant],
        isHero ? "border-bordeaux/70 border-[1.5px]" : "border-border",
      )}
      style={focused ? { animation: "scheduleFocusFlash 1.6s ease-out 1" } : undefined}
    >
      <MobileSundayHeader
        date={date}
        type={type}
        kind={kind}
        cancelled={cancelled}
        countdown={countdown}
        urgent={urgent}
        hasConfirmedSpeaker={hasConfirmedSpeaker}
        wardId={wardId}
        nonMeetingSundays={nonMeetingSundays}
        isHero={isHero}
        editable={editable}
      />

      {isHero && !cancelled && (
        <MobileSundayHeroSummary
          date={date}
          variant={kind.variant}
          speakers={speakers}
          meeting={meeting}
        />
      )}

      <div
        className={cn(!editable && "pointer-events-none opacity-80 select-none")}
        aria-disabled={!editable}
      >
        <Body
          cancelled={cancelled}
          cancelReason={meeting?.cancellation?.reason}
          kind={kind}
          date={date}
          meeting={meeting ?? null}
          speakers={speakers}
        />
      </div>
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
