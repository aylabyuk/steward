import { daysBetween } from "@/lib/dates";
import type { MeetingType, SacramentMeeting } from "@/lib/types";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  fallbackType: MeetingType;
}

const TYPE_LABELS: Record<MeetingType, string> = {
  regular: "Regular",
  fast_sunday: "Fast Sunday",
  ward_conference: "Ward Conference",
  stake_conference: "Stake Conference",
  general_conference: "General Conference",
  other: "Other",
};

const NO_MEETING = new Set<MeetingType>(["stake_conference", "general_conference"]);

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

export function MeetingCard({ date, meeting, fallbackType }: Props) {
  const type = meeting?.meetingType ?? fallbackType;
  const cancelled = Boolean(meeting?.cancellation?.cancelled);
  const isNonMeeting = NO_MEETING.has(type);
  const days = daysBetween(new Date(), date);

  const base = "flex flex-col gap-2 rounded-lg border p-4 text-left shadow-sm transition";
  const style = isNonMeeting
    ? "border-slate-200 bg-slate-100 text-slate-500"
    : "border-slate-200 bg-white hover:border-slate-300";

  return (
    <article className={`${base} ${style}`}>
      <header className="flex items-baseline justify-between">
        <h3 className={`font-semibold ${cancelled ? "text-slate-400 line-through" : ""}`}>
          {formatLongDate(date)}
        </h3>
        <span className="text-xs uppercase tracking-wide text-slate-500">{TYPE_LABELS[type]}</span>
      </header>
      <CardBody
        cancelled={cancelled}
        reason={meeting?.cancellation?.reason}
        isNonMeeting={isNonMeeting}
        days={days}
      />
    </article>
  );
}
