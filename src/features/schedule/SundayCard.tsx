import { useRef, useState } from "react";
import { Link } from "react-router";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useCommentUnread } from "@/hooks/useCommentUnread";
import { useSpeakers } from "@/hooks/useMeeting";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { cn } from "@/lib/cn";
import { kindLabel } from "./kindLabel";
import { SpeakerEditor } from "./SpeakerEditor";
import { AssignDialog } from "./AssignDialog";
import { leadTimeSeverity } from "@/features/speakers/leadTime";

const SEVERITY_TEXT: Record<"warn" | "urgent", string> = {
  warn: "Less than 2 weeks notice — consider a later week.",
  urgent: "Short notice. Confirm directly.",
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const severity = leadTimeSeverity(new Date(), date, leadTimeDays);
  const badge = useCommentUnread(wardId, date);

  const isNoMeeting = kind.variant === "noMeeting";

  function formatDate(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function formatCountdown(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    const eventDate = new Date(y, m - 1, d);
    const today = new Date();
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return "Past";
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "In 1 day";
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    const weeks = Math.ceil(daysUntil / 7);
    return `In ${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  if (isNoMeeting) {
    return (
      <article className="rounded-lg border border-border bg-parchment-2 p-4 text-walnut-2">
        <div className="mb-3">
          <p className="text-sm">{kind.label} — no sacrament meeting</p>
        </div>
      </article>
    );
  }

  if (cancelled) {
    return (
      <article className="rounded-lg border border-border bg-chalk p-4 shadow-elev-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-lg font-semibold text-walnut line-through">{formatDate(date)}</p>
            <p className="text-xs font-mono tracking-wider text-walnut-3 mt-1">Cancelled</p>
          </div>
          <button className="text-walnut-2 hover:text-walnut p-1" title="Options">
            ⋯
          </button>
        </div>
        {meeting?.cancellation?.reason && (
          <p className="text-sm text-walnut-2">{meeting.cancellation.reason}</p>
        )}
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-border bg-chalk shadow-elev-1 hover:shadow-elev-2 hover:border-border-strong transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <Link
          to={`/week/${date}`}
          className="flex-1 hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-display font-semibold text-walnut leading-tight">
            {formatDate(date)}
          </div>
          <div className={cn(
            "text-xs font-mono tracking-wider mt-1",
            severity === "urgent" ? "text-bordeaux font-semibold" : "text-walnut-3"
          )}>
            {formatCountdown(date).toUpperCase()}
          </div>
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-walnut-3 hover:text-walnut p-1 text-lg leading-none"
            title="Options"
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-1 w-40 bg-chalk border border-border rounded-md shadow-elev-2 z-10 overflow-hidden text-sm"
            >
              <button className="w-full px-4 py-2 text-left text-walnut hover:bg-parchment transition">
                Change type
              </button>
              <button className="w-full px-4 py-2 text-left text-bordeaux hover:bg-danger-soft transition">
                Cancel meeting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notice */}
      {severity !== "none" && (
        <div className="mx-4 mb-3 rounded-md border border-danger-soft bg-danger-soft/30 px-3 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-bordeaux shrink-0"></span>
          <span className="text-xs text-bordeaux-deep">{SEVERITY_TEXT[severity]}</span>
        </div>
      )}

      {/* Body */}
      <div className="px-4 pb-4">
        {speakers.length === 0 ? (
          <p className="text-sm text-walnut-2 italic py-3">No speakers yet.</p>
        ) : (
          <ul className="space-y-0 mb-3">
            {speakers.map((s, idx) => (
              <li
                key={s.id}
                className="flex items-center gap-3 py-3 border-b border-border last:border-b-0"
              >
                <div className="text-sm font-mono text-brass-deep font-semibold w-6 text-center">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-sans font-semibold text-walnut">
                    {s.data.name}
                  </div>
                  <div className="text-sm font-serif italic text-walnut-2">
                    {s.data.topic || "No topic"}
                  </div>
                </div>
                <div className={cn(
                  "text-xs font-mono font-semibold px-3 py-1.5 rounded-full whitespace-nowrap",
                  s.data.status === "confirmed"
                    ? "bg-success-soft text-success"
                    : s.data.status === "declined"
                    ? "bg-danger-soft text-bordeaux"
                    : s.data.status === "invited"
                    ? "bg-brass-soft/50 text-brass-deep"
                    : "bg-parchment-2 text-walnut-2"
                )}>
                  {s.data.status?.toUpperCase() || "PLANNED"}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add Speaker Button */}
        <button
          onClick={() => setAssignDialogOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-bordeaux hover:text-bordeaux-deep transition-colors"
        >
          <span className="w-5 h-5 border border-bordeaux rounded-sm flex items-center justify-center text-lg leading-none">
            +
          </span>
          Add speaker
        </button>
      </div>

      {/* Dialog */}
      <AssignDialog
        open={assignDialogOpen}
        date={date}
        onClose={() => setAssignDialogOpen(false)}
      >
        <SpeakerEditor date={date} onClose={() => setAssignDialogOpen(false)} />
      </AssignDialog>
    </article>
  );
}
