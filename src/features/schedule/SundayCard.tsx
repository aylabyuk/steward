import { useRef, useState } from "react";
import { Link } from "react-router";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useCommentUnread } from "@/hooks/useCommentUnread";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { cn } from "@/lib/cn";
import { kindLabel } from "./kindLabel";
import { SundayCardBody } from "./SundayCardBody";
import { leadTimeSeverity } from "@/features/speakers/leadTime";

const SEVERITY_STYLE: Record<"warn" | "urgent", string> = {
  warn: "bg-yellow-50 text-yellow-800 border-yellow-200",
  urgent: "bg-red-50 text-red-800 border-red-200",
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const severity = leadTimeSeverity(new Date(), date, leadTimeDays);
  const badge = useCommentUnread(wardId, date);

  const isNoMeeting = kind.variant === "noMeeting";

  function formatDate(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <article
      className={cn(
        "rounded-lg border p-4 transition-all duration-200",
        isNoMeeting
          ? "border-border bg-parchment-2 text-walnut-2"
          : "border-border bg-chalk shadow-elev-1 hover:shadow-elev-2 hover:border-border-strong",
      )}
    >
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <Link
          to={`/week/${date}`}
          className={cn(
            "font-semibold hover:underline",
            cancelled ? "text-walnut-2 line-through" : "",
          )}
        >
          {formatDate(date)}
        </Link>
        <div className="flex items-center gap-2">
          {badge.count > 0 && (
            <Link
              to={`/week/${date}#comments`}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                badge.unread
                  ? "bg-danger-soft text-red-900"
                  : "bg-info-soft text-blue-900",
              )}
              title={badge.unread ? "Unread comments" : "Comments"}
            >
              💬 {badge.count}
            </Link>
          )}
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-brass-soft text-walnut-2">
            {kind.label}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-walnut-2 hover:text-walnut p-1"
              title="Options"
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-1 w-32 bg-chalk border border-border rounded-md shadow-elev-2 z-10 overflow-hidden text-sm"
              >
                <button className="w-full px-4 py-2 text-left text-walnut hover:bg-parchment-2 transition">
                  Change type
                </button>
                <button className="w-full px-4 py-2 text-left text-red-700 hover:bg-danger-soft transition">
                  Cancel meeting
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {cancelled && (
        <p className="text-sm text-walnut-2 mb-3">
          Cancelled{meeting?.cancellation?.reason ? ` — ${meeting.cancellation.reason}` : ""}
        </p>
      )}

      {!cancelled && !isNoMeeting && severity !== "none" && (
        <div className={cn("rounded-md border px-3 py-2 text-xs mb-3", SEVERITY_STYLE[severity])}>
          {SEVERITY_TEXT[severity]}
        </div>
      )}

      {!cancelled && !isNoMeeting && <SundayCardBody date={date} type={type} />}
    </article>
  );
}
