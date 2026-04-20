import { Link } from "react-router";
import { SpeakerSection } from "@/features/speakers/SpeakerSection";
import { useCommentUnread } from "@/hooks/useCommentUnread";
import { daysBetween } from "@/lib/dates";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  fallbackType: MeetingType;
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

const TYPE_LABELS: Record<MeetingType, string> = {
  regular: "Regular",
  fast: "Fast Sunday",
  stake: "Stake Conference",
  general: "General Conference",
};

const NO_MEETING = new Set<MeetingType>(["stake", "general"]);

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function relativeDays(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function CardBody({
  cancelled,
  reason,
  isNonMeeting,
  days,
}: {
  cancelled: boolean;
  reason: string | undefined;
  isNonMeeting: boolean;
  days: number;
}) {
  if (cancelled) {
    return <p className="text-sm text-slate-500">Cancelled — {reason ?? "no reason given"}</p>;
  }
  if (isNonMeeting) {
    return <p className="text-sm">No sacrament meeting.</p>;
  }
  return <p className="text-sm text-slate-600">{relativeDays(days)}</p>;
}

export function MeetingCard({
  wardId,
  date,
  meeting,
  fallbackType,
  leadTimeDays,
  nonMeetingSundays,
}: Props) {
  const type = meeting?.meetingType ?? fallbackType;
  const cancelled = Boolean(meeting?.cancellation?.cancelled);
  const isNonMeeting = NO_MEETING.has(type);
  const days = daysBetween(new Date(), date);
  const badge = useCommentUnread(wardId, date);

  const base = "flex flex-col gap-2 rounded-lg border p-4 text-left shadow-sm transition";
  const style = isNonMeeting
    ? "border-slate-200 bg-slate-100 text-slate-500"
    : "border-slate-200 bg-white hover:border-slate-300";

  return (
    <article className={`${base} ${style}`}>
      <header className="flex items-baseline justify-between">
        <Link
          to={`/week/${date}`}
          className={`font-semibold hover:underline ${cancelled ? "text-slate-400 line-through" : ""}`}
        >
          {formatLongDate(date)}
        </Link>
        <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
          {badge.count > 0 && (
            <Link
              to={`/week/${date}#comments`}
              className={`rounded-full px-2 py-px text-[10px] normal-case tracking-normal ${
                badge.unread ? "bg-red-500 text-white" : "bg-slate-200 text-slate-700"
              }`}
              title={badge.unread ? "Unread comments" : "Comments"}
            >
              💬 {badge.count}
            </Link>
          )}
          {TYPE_LABELS[type]}
        </span>
      </header>
      <CardBody
        cancelled={cancelled}
        reason={meeting?.cancellation?.reason}
        isNonMeeting={isNonMeeting}
        days={days}
      />
      {!cancelled && !isNonMeeting && (
        <SpeakerSection
          wardId={wardId}
          date={date}
          type={type}
          leadTimeDays={leadTimeDays}
          nonMeetingSundays={nonMeetingSundays}
        />
      )}
    </article>
  );
}
